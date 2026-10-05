import { Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { JwtAuthGuard } from "src/shared/guards/JwtAuthGuard";
import { RolesGuard } from "src/shared/guards/roles.guard";
import { UserRole } from "../auth/entities/auth.entity";
import { Roles } from "src/shared/decorators/roles.decorator";
import { QueueAccessGuard } from "src/shared/guards/QueueAccessGuard";

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('doctor/:doctorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async getDoctorQueue(@Param('doctorId', ParseUUIDPipe) doctorId: string) {
    return this.queueService.getDoctorQueue(doctorId);
  }

  @Patch(':id/call')
  @UseGuards(JwtAuthGuard, RolesGuard, QueueAccessGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async call(@Req() req: any) {
    return this.queueService.call(req.queueEntry);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard, QueueAccessGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async start(@Req() req: any) {
    return this.queueService.start(req.queueEntry);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard, QueueAccessGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async complete(@Req() req: any) {
    return this.queueService.complete(req.queueEntry);
  }

  @Patch(':id/skip')
  @UseGuards(JwtAuthGuard, RolesGuard, QueueAccessGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async skip(@Req() req: any) {
    return this.queueService.skip(req.queueEntry);
  }

  @Get('position/:appointmentId')
  async getPosition(@Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
    return this.queueService.getPositionByAppointment(appointmentId);
  }
}