

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from "./entitities/appointment.entity";
import { Doctor } from "../doctors/doctor.entity";
import { Schedule } from "../doctors/schedule.entity";
import { AppointmentAuthGuard } from "src/shared/guards/appointment-auth.guard";


@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Doctor, Schedule])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentAuthGuard],
})
export class AppointmentsModule {}