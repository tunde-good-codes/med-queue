import { Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QueueRepo } from './entities/queue';
import { Appointment } from '../appointments/entitities/appointment.entity';
import { Schedule } from '../doctors/schedule.entity'; // adjust path to your actual file
import { QueueStatus, QUEUE_TRANSITIONS } from './types/queue';
import { QueueGateway } from './queue.gateway';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueRepo)
    private readonly queueRepository: Repository<QueueRepo>,

    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,

    private readonly queueGateway: QueueGateway,
  ) {}

  async createEntryForAppointment(appointment: Appointment) {
    const existing = await this.queueRepository.findOne({
      where: { appointmentId: appointment.id },
    });
    if (existing) {
      return existing;
    }

    const schedule = await this.scheduleRepository.findOne({
      where: {
        doctorId: appointment.doctorId,
        dayOfWeek: new Date(appointment.scheduleDate).getUTCDay(),
      },
    });

    const activeCount = await this.queueRepository.count({
      where: {
        doctorId: appointment.doctorId,
        date: appointment.scheduleDate,
        status: In([QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_PROGRESS]),
      },
    });

    const position = activeCount + 1;
    const slotDuration = schedule?.slotDurationMinutes ?? 30;

    const entry = this.queueRepository.create({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      date: appointment.scheduleDate,
      position,
      estimatedWaitMinutes: (position - 1) * slotDuration,
      status: QueueStatus.WAITING,
    });

    const saved = await this.queueRepository.save(entry);

    this.queueGateway.emitToDoctorRoom(appointment.doctorId, 'queue:position_update', {
      appointmentId: appointment.id,
      position: saved.position,
      estimatedWaitMinutes: saved.estimatedWaitMinutes,
    });

    return saved;
  }
}