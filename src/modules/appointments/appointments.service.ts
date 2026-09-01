import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from '../doctors/schedule.entity';
import { In, LessThan, Not, Repository } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';
import { Appointment } from './entitities/appointment.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
} from './dto/create-appointment-dto';
import {
  AppointmentPaymentStatus,
  AppointmentStatus,
  AppointmentTransitions,
} from './appointment.types';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}
  private readonly logger = new Logger('appointment-service');

  async createAppointment(patientId: string, dto: CreateAppointmentDto) {
    const logger = new Logger('appointment - log');
    const availableDoctor = await this.doctorRepository.findOne({
      where: {
        id: dto.doctorId,
      },
    });

    if (!availableDoctor) {
      throw new NotFoundException('doctor not available');
    }

    if (!availableDoctor.isAvailable) {
      throw new BadRequestException('doctor is not available at this time');
    }

    const dayOfWeek = new Date(dto.scheduledDate).getUTCDay();
    logger.log(dayOfWeek);

    const schedule = await this.scheduleRepository.findOne({
      where: {
        doctorId: dto.doctorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      throw new BadRequestException('this doctor is fully booked at this time');
    }

    if (
      dto.scheduledTime < schedule.startTime ||
      dto.scheduledTime >= schedule.endTime
    ) {
      throw new BadRequestException(
        'request time is outside doctor working hours',
      );
    }

    const slotCount = await this.appointmentRepository.count({
      where: {
        scheduleDate: dto.scheduledDate,
        doctorId: dto.doctorId,
        scheduleTime: dto.scheduledTime,
        appointmentStatus: Not(
          In([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]),
        ),
      },
    });

    const appointment = this.appointmentRepository.create({
      doctorId: dto.doctorId,
      hospitalId: availableDoctor.hospitalId,
      patientId,
      appointmentStatus: AppointmentStatus.PENDING,
      reason: dto.reason,
      slotNumber: slotCount + 1,
      fee: availableDoctor.consultationFee,
      scheduleDate: dto.scheduledDate,
      scheduleTime: dto.scheduledTime,
    });

    await this.appointmentRepository.save(appointment);

    return { appointment };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cancelUnpaidAppointment() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const unpaidAppointments = await this.appointmentRepository.find({
      where: {
        appointmentStatus: AppointmentStatus.PENDING,
        paymentStatus: AppointmentPaymentStatus.UNPAID,
        createdAt: LessThan(cutoff),
      },
    });

    if (unpaidAppointments.length === 0) {
      return;
    }

    for (const appointment of unpaidAppointments) {
      appointment.appointmentStatus = AppointmentStatus.CANCELLED;
    }

    await this.appointmentRepository.save(unpaidAppointments);
    this.logger.log(`appointment cancelled for ${unpaidAppointments.length}`);
    return {
      message: 'appointment cancelled after being unpaid',
    };
  }
  async deleteAppointment(id: string) {
    const result = await this.appointmentRepository.delete({
      id,
    });

    if (result.affected === 0) {
      throw new BadRequestException('error deleting appointment');
    }

    return {
      message: 'appointment deleted',
    };
  }

  async rescheduleAppointment(
    dto: RescheduleAppointmentDto,
    appointment: Appointment,
  ) {
    if (
      appointment.appointmentStatus !== AppointmentStatus.PENDING &&
      appointment.appointmentStatus !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'you can only reschedule appointments whose status is pending and confirmed',
      );
    }

    const dayOfWeek = new Date(dto.scheduledDate).getUTCDay();
    const schedule = await this.scheduleRepository.findOne({
      where: {
        doctorId: appointment.doctorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      throw new BadRequestException('doctor is not available at this time');
    }

    if (
      dto.scheduledTime < schedule.startTime ||
      dto.scheduledTime >= schedule.endTime
    ) {
      throw new BadRequestException(
        'doctor have no available slot at this time',
      );
    }

    const countSlot = await this.appointmentRepository.count({
      where: {
        doctorId: appointment.id,
        scheduleDate: dto.scheduledDate,
        scheduleTime: dto.scheduledTime,
        appointmentStatus: Not(
          In([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]),
        ),
      },
    });

    if (countSlot > schedule.maxPatientsPerSlot) {
      throw new ConflictException('The time slot is fully booked');
    }

    appointment.scheduleDate = dto.scheduledDate;
    appointment.scheduleTime = dto.scheduledTime;

    appointment.slotNumber = countSlot + 1;

    await this.appointmentRepository.save(appointment);
  }

  async findMineAppointment(patientId: string, pagination: PaginationQueryDto) {
    const { page = 1, limit = 3 } = pagination;

    const skip = (page - 1) * 3;

    const [appointments, total] = await this.appointmentRepository.findAndCount(
      {
        where: {
          patientId,
        },

        skip,
        take: limit,
        order: {
          scheduleDate: 'ASC',
          scheduleTime: 'asc',
        },
      },
    );
    return {
      appointments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findDoctorAppointmentToday(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        scheduleDate: today,
      },
      order: {
        scheduleDate: 'asc',
      },
    });

    return {
      appointments,
    };
  }

  async updateAppointment(id: string, status: AppointmentStatus) {
    const appointment = await this.appointmentRepository.update(id, {
      appointmentStatus: status,
    });

    return {
      message: 'appointment updated',
    };
  }
  private transitionStatus(
    appointment: Appointment,
    newStatus: AppointmentStatus,
  ): void {
    const allowed = AppointmentTransitions[appointment.appointmentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition appointment from "${appointment.appointmentStatus}" to "${newStatus}"`,
      );
    }
    appointment.appointmentStatus = newStatus;
  }

  async cancel(appointment: Appointment) {
    this.transitionStatus(appointment, AppointmentStatus.CANCELLED);
    return this.appointmentRepository.save(appointment);
  }

  async confirm(appointment: Appointment) {
    this.transitionStatus(appointment, AppointmentStatus.CONFIRMED);
    return this.appointmentRepository.save(appointment);
  }

  async start(appointment: Appointment) {
    this.transitionStatus(appointment, AppointmentStatus.IN_PROGRESS);
    return this.appointmentRepository.save(appointment);
  }

  async complete(appointment: Appointment) {
    this.transitionStatus(appointment, AppointmentStatus.COMPLETED);
    return this.appointmentRepository.save(appointment);
  }

  async markNoShow(appointment: Appointment) {
    this.transitionStatus(appointment, AppointmentStatus.NO_SHOW);
    return this.appointmentRepository.save(appointment);
  }
}
