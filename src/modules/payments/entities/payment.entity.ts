import { Appointment } from 'src/modules/appointments/entitities/appointment.entity';
import { Auth } from 'src/modules/auth/entities/auth.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentProvider, PaymentStatus } from '../payment.types';

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'appointmentId',
  })
  appointment: Appointment;
  @Index()
  @Column({
    type: 'uuid',
  })
  appointmentId: string;

  @ManyToOne(() => Auth, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Auth;
  @Index()
  @Column({
    type: 'uuid',
  })
  patientId: string;
  @Index({
    unique: true,
  })
  @Column({
    type: 'text',
  })
  reason: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paidAt: Date;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.PAYSTACK,
  })
  provider: PaymentProvider;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
