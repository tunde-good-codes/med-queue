
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectHospitalDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Please provide a meaningful rejection reason' })
  reason: string;
}