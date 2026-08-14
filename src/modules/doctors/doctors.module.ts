import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Schedule } from "./schedule.entity";
import { DoctorAuthGuard } from "src/shared/guards/doctor.guard";

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorAuthGuard],
  imports: [TypeOrmModule.forFeature([Doctor, Schedule])],
})
export class DoctorsModule {}
