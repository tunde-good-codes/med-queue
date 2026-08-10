import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('schedules')
@Unique(['doctorId', 'dayOfWeek']) // one schedule row per doctor per day — no duplicates
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Index()
  @Column({ type: 'uuid' })
  doctorId: string;

  @Column({ type: 'smallint' }) // 0=Sunday ... 6=Saturday
  dayOfWeek: number;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'smallint', default: 30 })
  slotDurationMinutes: number;

  @Column({ type: 'smallint', default: 1 })
  maxPatientsPerSlot: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}