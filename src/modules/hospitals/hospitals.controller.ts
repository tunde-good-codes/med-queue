import { UpdateHospitalDto } from './dtos/update-hospital.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetService,
  ApiUpdateNew,
} from 'src/shared/decorators/swagger-docs.decorators';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';
import { JwtAuthGuard } from 'src/shared/guards/JwtAuthGuard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { HospitalOwnershipGuard } from 'src/shared/guards/hospital.guard';
import { UserRole } from '../auth/entities/auth.entity';
import { Roles } from 'src/shared/decorators/roles.decorator';

@Controller('hospitals')
@ApiTags('Hospital Service')
export class HospitalsController {
  constructor(private readonly hospitalService: HospitalsService) {}

  @ApiGetService('get all hospitals')
  @ResponseMessage('all hospitals fetched')
  @Get('')
  async getAllHospital() {
    return this.hospitalService.getAllHospital();
  }
  @UseGuards(JwtAuthGuard, RolesGuard, HospitalOwnershipGuard)
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  @ApiUpdateNew('update hospital data', UpdateHospitalDto)
  @ResponseMessage('updated hospital successfully')
  @Patch(':id')
  async updateHospital(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHospitalDto,
  ) {
    return this.hospitalService.updateHospitalProfile(id, dto);
  }
  @UseGuards(JwtAuthGuard)
  @ApiGetService('hospital fetched!')
  @ResponseMessage('fetched hospital successfully')
  @Get(':id')
  async getSingleHospital(@Param('id', ParseUUIDPipe) id: string) {
    return this.hospitalService.getSingleHospital(id);
  }
}
