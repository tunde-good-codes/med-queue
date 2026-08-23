import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from '../doctors/schedule.entity';
import { In, Not, Repository } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';
import { Appointment } from './entitities/appointment.entity';
import {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentDto,
} from './dto/create-appointment-dto';
import {
  AppointmentStatus,
  AppointmentTransitions,
  PaymentStatus,
} from './appointment.types';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { log } from 'console';

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

  async updateAppointment(patientId: string, dto: UpdateAppointmentDto) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        patientId,
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        'appointment not found found for this patient',
      );
    }

    // if(appointment){
    //         appointment?.doctorId = dto.doctorId
    //         appointment.appointmentStatus = dto.appointmentStatus,

    // }
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
