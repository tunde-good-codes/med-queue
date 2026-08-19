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
import {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
} from './dto/create-appointment-dto';
import { AppointmentAuthGuard } from 'src/shared/guards/appointment-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiGetService,
  ApiUpdate,
} from 'src/shared/decorators/swagger-docs.decorators';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';

@ApiTags('Appointments service')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post("create-appointment")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiCreate('create a new appointment with a doctor', CreateAppointmentDto)
  @ResponseMessage('appointment created')
  @Roles(UserRole.PATIENT, UserRole.ADMIN)
  async book(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiGetService('fetched patient appointment ')
  @ResponseMessage('Get my appointment successfully')
  async findMine(@Req() req: any, @Query() query: PaginationQueryDto) {
    return this.appointmentsService.findMineAppointment(req.user.id, query);
  }

  @Get('doctor/today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiGetService("fetched all doctor's  appointment today")
  @ResponseMessage('Get my appointment successfully')
  @Roles(UserRole.DOCTOR)
  async findDoctorToday(@Req() req: any) {
    return this.appointmentsService.findDoctorAppointmentToday(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AppointmentAuthGuard)
  async findOne(@Req() req: any) {
    return req.appointment;
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, AppointmentAuthGuard)
  @ApiUpdate('cancel an appointment')
  @ResponseMessage('appointment cancelled')
  async cancel(@Req() req: any) {
    return this.appointmentsService.cancel(req.appointment);
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard, AppointmentAuthGuard)
  @ApiUpdate('reschedule an appointment')
  @ResponseMessage('appointment rescheduled')
  @Roles(UserRole.PATIENT)
  async reschedule(@Req() req: any, @Body() dto: RescheduleAppointmentDto) {
    if (!req.isOwningPatient) {
      throw new ForbiddenException(
        'Only the patient who booked can reschedule',
      );
    }
    return this.appointmentsService.rescheduleAppointment(dto, req.appointment);
  }

  @Patch(':id/start')
   @ApiUpdate('start an appointment')
  @ResponseMessage('appointment started')
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
   @ApiUpdate('complete an appointment')
  @ResponseMessage('appointment completed')
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
   @ApiUpdate('absent on an appointment')
  @ResponseMessage('patient absent on appointment ')
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
