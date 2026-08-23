import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Auth } from '../auth/entities/auth.entity';
import { Hospital } from '../hospitals/entities/hospital.entity';
import { Department } from '../hospitals/entities/department.entity';
import { Specialty } from './doctor.types';
import { Schedule } from './schedule.entity';
import { Appointment } from '../appointments/entitities/appointment.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Auth, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
  })
  user: Auth;

  @Index()
  @Column({
    type: 'uuid',
  })
  userId: string;

  @ManyToOne(() => Hospital, (hospital) => hospital.doctors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'hospitalId',
  })
  hospital: Hospital;

  @Index()
  @Column({
    type: 'uuid',
  })
  hospitalId: string;
  @ManyToOne(() => Department, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'departmentId',
  })
  department: Department;

  @Index()
  @Column({ type: 'uuid', nullable: true, insert: false, update: false })
  departmentId: string | null;

  @Column({
    type: 'text',
    unique: true,
  })
  licenseNumber: string;

  @Column({
    type: 'enum',
    enum: Specialty,
    default: Specialty.GENERAL_PRACTICE,
  })
  specialty: Specialty;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    transformer: {
      from: (value: string | null) => (value ? parseFloat(value) : 0),
      to: (value: number) => value,
    },
  })
  rating: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      from: (value: string | null) => (value ? parseFloat(value) : 0),
      to: (value: number) => value,
    },
  })
  consultationFee: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  isAvailable: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  totalRatings: number;
  @Column({
    type: 'int',
    default: 0,
  })
  yearsOfExperience: number;

  @OneToMany(() => Appointment, (a) => a.doctor)
  appointments: Appointment[];

  @OneToMany(() => Schedule, (schedule) => schedule.doctor)
  schedules: Schedule[];
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
