import { Hospital } from 'src/modules/hospitals/entities/hospital.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  HOSPITAL = 'hospital',
  ADMIN = 'admin',
}
@Entity('users')
export class Auth {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({
    unique: true,
    nullable: true,
  })
  email: string;
  @Column({ nullable: true, select: false })
  password?: string;
  @Column({
    nullable: true,
  })
  firstName: string;

  @Column({
    nullable: true,
  })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Column({
    nullable: true,
  })
  phoneNumber: string;

  @Column({
    nullable: true,
  })
  profileImage: string;
  @Column({ type: 'varchar', unique: true, nullable: true })
  googleId?: string;
  @Column({
    nullable: true,
    type: 'date',
  })
  dateOfBirth: Date;

  @Column({
    default: 1,
    nullable: true,
  })
  tokenVersion: number;
  @Column({
    type: 'boolean',
    default: false,
  })
  isVerified: boolean;

  @OneToOne(() => Hospital, (hospital) => hospital.user, {
    onDelete: 'CASCADE',
  })
  hospitalProfile: Hospital;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
