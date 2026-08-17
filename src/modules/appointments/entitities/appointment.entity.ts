import { Auth } from 'src/modules/auth/entities/auth.entity';
import { Doctor } from 'src/modules/doctors/doctor.entity';
import { Hospital } from 'src/modules/hospitals/entities/hospital.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppointmentStatus, PaymentStatus } from '../appointment.types';

@Entity('appointment')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Auth, (auth) => auth.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'patientId',
  })
  patient: Auth;

  @Column({
    type: 'uuid',
  })
  patientId: string;

  @ManyToOne(() => Doctor, (d) => d.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'doctorId',
  })
  doctor: Doctor;

  @Column({
    type: 'uuid',
  })
  doctorId: string;

  @ManyToOne(() => Hospital, (h) => h.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'hospitalId',
  })
  hospital: Hospital;

  @Column({
    type: 'uuid',
  })
  hospitalId: string;

  @Column({
    type: 'date',
  })
  scheduleDate: string;

  @Column({
    type: 'time',
  })
  scheduleTime: string;
  @Column({
    type: 'int',
  })
  slotNumber: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  appointmentStatus: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  note: string;

  @Column({
    type: 'text',
  })
  reason: string;

  @Column({
    type: 'float',
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => v,
    },
  })

  fee:number
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
