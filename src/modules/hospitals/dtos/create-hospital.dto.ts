import { 
  IsEnum, 
  IsNotEmpty, 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsNumber, 
  IsObject, 
  IsArray, 
  Max, 
  Min 
} from 'class-validator';
import { FacilityType, type WeeklySchedule } from "../hospital.types";

export class CreateHospitalDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(FacilityType)
  type: FacilityType;

  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

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