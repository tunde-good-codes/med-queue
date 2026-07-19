import { PartialType } from '@nestjs/swagger';
import { RegisterHospitalDto } from "./create-hospital.dto";
export class UpdateHospitalDto extends PartialType(RegisterHospitalDto){}