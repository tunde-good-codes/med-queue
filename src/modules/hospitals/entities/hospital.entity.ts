import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import {
  FacilityType,
  HospitalImage,
  HospitalVerificationStatus,
  type WeeklySchedule,
} from '../hospital.types';
import { Auth } from 'src/modules/auth/entities/auth.entity';
import { Department } from './department.entity';
import { Doctor } from 'src/modules/doctors/doctor.entity';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({
    type: 'enum',
    enum: FacilityType,
    default: FacilityType.GENERAL_HOSPITAL,
  })
  type: FacilityType;

  @Column({ type: 'varchar', unique: true, length: 100 })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 255 })
  streetAddress: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  zipCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @OneToMany(() => Department, (department) => department.hospital)
  departments: Department[];

  @OneToMany(() => Doctor, (doctor) => doctor.hospital)
  doctors: Doctor[];
  @Column({ type: 'jsonb' })
  operatingHours: WeeklySchedule;

  @Column({ type: 'int', default: 100 })
  maxCapacity: number;

  @Column({ type: 'simple-array', nullable: true })
  acceptedInsuranceProviders: string[];

  @Column({
    type: 'enum',
    enum: HospitalVerificationStatus,
    default: HospitalVerificationStatus.PENDING,
  })
  verificationStatus: HospitalVerificationStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'jsonb', default: [] })
  images: HospitalImage[];
  @OneToOne(() => Auth, (user) => user.hospitalProfile, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
  })
  user: Auth;

  @Index()
  @Column({
    type: 'uuid',
    nullable: true,
  })
  userId: string;
  // --- Timestamps ---
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateSlug() {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
