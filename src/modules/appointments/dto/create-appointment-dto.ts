import { PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { AppointmentStatus } from '../appointment.types';

export class CreateAppointmentDto {
  @IsUUID()
  doctorId: string;

  @IsDateString()
  scheduledDate: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'scheduledTime must be HH:mm',
  })
  scheduledTime: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  reason: string;
}

export class RescheduleAppointmentDto {
  @IsDateString()
  scheduledDate: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'scheduledTime must be HH:mm',
  })
  scheduledTime: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  appointmentStatus: AppointmentStatus;
}
