import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Specialty } from '../doctor.types';

export class RegisterDoctorDto {
  // --- Auth account fields ---
  @IsNotEmpty() @IsEmail() email: string;

  @IsNotEmpty() @MinLength(8) password: string;

  @IsNotEmpty() @IsString() firstName: string;

  @IsNotEmpty() @IsString() lastName: string;

  @IsNotEmpty() @IsString() phoneNumber: string;

  // --- Doctor profile fields ---
  @IsNotEmpty() @IsUUID() hospitalId: string;

  @IsOptional() @IsUUID() departmentId?: string;

  @IsNotEmpty() @IsEnum(Specialty) specialty: Specialty;

  @IsNotEmpty() @IsString() licenseNumber: string;

  @IsOptional() @IsString() bio?: string;

  @IsNotEmpty() @IsNumber() @Min(0) consultationFee: number;

  @IsOptional() @IsNumber() @Min(0) yearsOfExperience?: number;
}