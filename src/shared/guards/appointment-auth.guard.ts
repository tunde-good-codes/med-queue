
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from 'src/modules/appointments/entitities/appointment.entity';
import { UserRole } from 'src/modules/auth/entities/auth.entity';
import { Doctor } from 'src/modules/doctors/doctor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AppointmentAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    const appointment = await this.appointmentRepository.findOne({
      where: { id: params.id },
    });

    if (!appointment) {
      throw new NotFoundException('appointment with this id not found');
    }

    if (user.role === UserRole.ADMIN) {
      request.appointment = appointment;
      request.isOwningDoctor = true;
      request.isOwningPatient = true;
      return true;
    }

    const isOwningPatient = appointment.patientId === user.id;

    let isOwningDoctor = false;
    if (user.role === UserRole.DOCTOR) {
      const doctor = await this.doctorRepository.findOne({
        where: { userId: user.id },
      });
      if (!doctor) {
        throw new NotFoundException("can't find doctor");
      }
      isOwningDoctor = doctor.id === appointment.doctorId;
    }

    if (!isOwningDoctor && !isOwningPatient) {
      throw new ForbiddenException(
        "You don't have access to this appointment",
      );
    }

    request.appointment = appointment;
    request.isOwningDoctor = isOwningDoctor;
    request.isOwningPatient = isOwningPatient;
    return true;
  }
}