// src/modules/queue/entities/queue-entry.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from 'src/modules/appointments/entitities/appointment.entity';
import { QueueStatus } from '../types/queue';
import { Doctor } from 'src/modules/doctors/doctor.entity';

@Entity('queue_entries')
export class QueueRepo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  appointmentId: string;

  @OneToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;
  @Index()
  @Column({ type: 'uuid' })
  doctorId: string;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'int', default: 0 })
  estimatedWaitMinutes: number;

  @Index()
  @Column({ type: 'enum', enum: QueueStatus, default: QueueStatus.WAITING })
  status: QueueStatus;

  @Column({ type: 'timestamp', nullable: true })
  calledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
