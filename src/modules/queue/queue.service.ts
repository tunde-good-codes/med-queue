import { BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
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



  private transition(entry: QueueRepo, newStatus: QueueStatus) {
  const allowed = QUEUE_TRANSITIONS[entry.status];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot transition queue entry from "${entry.status}" to "${newStatus}"`,
    );
  }
  entry.status = newStatus;
}

async getDoctorQueue(doctorId: string) {
  const today = new Date().toISOString().split('T')[0];
  return this.queueRepository.find({
    where: { doctorId, date: today },
    order: { position: 'ASC' },
  });
}

async call(entry: QueueRepo) {
  this.transition(entry, QueueStatus.CALLED);
  entry.calledAt = new Date();
  const saved = await this.queueRepository.save(entry);

  this.queueGateway.emitToUser(saved.appointmentId, 'queue:your_turn', {
    message: 'You are next. Please proceed to the consultation room.',
  });
  return saved;
}

async start(entry: QueueRepo) {
  this.transition(entry, QueueStatus.IN_PROGRESS);
  entry.startedAt = new Date();
  return this.queueRepository.save(entry);
}

async complete(entry: QueueRepo) {
  this.transition(entry, QueueStatus.DONE);
  entry.completedAt = new Date();
  const saved = await this.queueRepository.save(entry);
  await this.recalculatePositions(entry.doctorId, entry.date);
  return saved;
}

async skip(entry: QueueRepo) {
  this.transition(entry, QueueStatus.SKIPPED);
  const saved = await this.queueRepository.save(entry);
  await this.recalculatePositions(entry.doctorId, entry.date);
  return saved;
}

private async recalculatePositions(doctorId: string, date: string) {
  const activeEntries = await this.queueRepository.find({
    where: { doctorId, date, status: In([QueueStatus.WAITING, QueueStatus.CALLED]) },
    order: { createdAt: 'ASC' },
  });

  const schedule = await this.scheduleRepository.findOne({
    where: { doctorId, dayOfWeek: new Date(date).getUTCDay() },
  });
  const slotDuration = schedule?.slotDurationMinutes ?? 30;

  for (let i = 0; i < activeEntries.length; i++) {
    activeEntries[i].position = i + 1;
    activeEntries[i].estimatedWaitMinutes = i * slotDuration;
  }
  await this.queueRepository.save(activeEntries);

  for (const entry of activeEntries) {
    this.queueGateway.emitToDoctorRoom(doctorId, 'queue:position_update', {
      appointmentId: entry.appointmentId,
      position: entry.position,
      estimatedWaitMinutes: entry.estimatedWaitMinutes,
    });
  }
}

async getPositionByAppointment(appointmentId: string) {
  const entry = await this.queueRepository.findOne({ where: { appointmentId } });
  if (!entry) {
    throw new NotFoundException('No queue entry found for this appointment');
  }
  return {
    position: entry.position,
    estimatedWaitMinutes: entry.estimatedWaitMinutes,
    status: entry.status,
  };
}
}