import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsObject, IsNumber, Min, Max, IsOptional, IsArray } from 'class-validator';
import { FacilityType,type WeeklySchedule } from "../hospital.types";

export class RegisterHospitalDto {
  // --- Core User Account Fields ---
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string; // Acts as Admin First Name for the contact person

  @IsNotEmpty()
  @IsString()
  lastName: string;  // Acts as Admin Last Name for the contact person

  // --- Hospital Profile Fields ---
  @IsNotEmpty()
  @IsString()
  hospitalName: string;

  @IsNotEmpty()
  @IsEnum(FacilityType)
  type: FacilityType;

  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  website: string;

  @IsNotEmpty()
  @IsString()
  streetAddress: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  zipCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNotEmpty()
  @IsObject()
  operatingHours: WeeklySchedule;

  @IsOptional()
  @IsNumber()
  maxCapacity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedInsuranceProviders: string[];
}