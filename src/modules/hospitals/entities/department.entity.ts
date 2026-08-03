import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Hospital } from './hospital.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @ManyToOne(() => Hospital, (hospital) => hospital.departments, {
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


  @CreateDateColumn()
  createdAt:Date

  @UpdateDateColumn()
  updatedAt:Date
}
