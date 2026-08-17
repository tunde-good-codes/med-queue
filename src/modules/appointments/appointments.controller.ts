import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

import { JwtAuthGuard } from 'src/shared/guards/JwtAuthGuard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserRole } from 'src/modules/auth/entities/auth.entity';

import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { CreateAppointmentDto } from './dto/create-appointment-dto';
import { AppointmentAuthGuard } from 'src/shared/guards/appointment-auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  async book(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  async findMine(@Req() req: any, @Query() query: PaginationQueryDto) {
    return this.appointmentsService.findMineAppointment(req.user.id, query);
  }

  @Get('doctor/today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async findDoctorToday(@Req() req: any) {
    // resolves the logged-in doctor's own id — mirrors GET /doctors/me pattern
    return this.appointmentsService.findDoctorAppointmentToday(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AppointmentAuthGuard)
  async findOne(@Req() req: any) {
    return req.appointment;
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, AppointmentAuthGuard)
  async cancel(@Req() req: any) {
    // both patient and doctor may cancel — Auth guard already confirmed relationship
    return this.appointmentsService.cancel(req.appointment);
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard, AppointmentAuthGuard)
  @Roles(UserRole.PATIENT)
  async reschedule(@Req() req: any, @Body() dto: any) {
    if (!req.isOwningPatient) {
      throw new ForbiddenException(
        'Only the patient who booked can reschedule',
      );
    }
    return this.appointmentsService.rescheduleAppointment(req.appointment, dto);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard, AppointmentAuthGuard)
  @Roles(UserRole.DOCTOR)
  async start(@Req() req: any) {
    if (!req.isOwningDoctor) {
      throw new ForbiddenException(
        'Only the attending doctor can start this appointment',
      );
    }
    return this.appointmentsService.start(req.appointment);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard, AppointmentAuthGuard)
  @Roles(UserRole.DOCTOR)
  async complete(@Req() req: any) {
    if (!req.isOwningDoctor) {
      throw new ForbiddenException(
        'Only the attending doctor can complete this appointment',
      );
    }
    return this.appointmentsService.complete(req.appointment);
  }

  @Patch(':id/no-show')
  @UseGuards(JwtAuthGuard, RolesGuard, AppointmentAuthGuard)
  @Roles(UserRole.DOCTOR)
  async noShow(@Req() req: any) {
    if (!req.isOwningDoctor) {
      throw new ForbiddenException(
        'Only the attending doctor can mark a no-show',
      );
    }
    return this.appointmentsService.markNoShow(req.appointment);
  }
}
