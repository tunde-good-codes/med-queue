import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService],
  imports: [TypeOrmModule.forFeature([Doctor])],
})
export class DoctorsModule {}
