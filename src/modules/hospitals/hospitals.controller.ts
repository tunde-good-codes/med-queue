import { UpdateHospitalDto } from './dtos/update-hospital.dto';
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetService,
  ApiPost,
  ApiUpdateNew,
} from 'src/shared/decorators/swagger-docs.decorators';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';
import { JwtAuthGuard } from 'src/shared/guards/JwtAuthGuard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { HospitalOwnershipGuard } from 'src/shared/guards/hospital.guard';
import { UserRole } from '../auth/entities/auth.entity';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RejectHospitalDto } from './dtos/reject-hospital.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { FilesInterceptor } from "@nestjs/platform-express";
import { imageUploadOptions } from "src/shared/config/multer.config";

@Controller('hospitals')
@ApiTags('Hospital Service')
export class HospitalsController {
  constructor(private readonly hospitalService: HospitalsService) {}

  @ApiGetService('get all hospitals')
  @ResponseMessage('all hospitals fetched')
  @Get('')
  async getAllHospital(@Query() query: PaginationQueryDto) {
    return this.hospitalService.getAllHospital(query);
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

  @ApiGetService('verify hospital')
  @ResponseMessage('hospital verified successfully')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/verify')
  async verifyHospital(@Param('id', ParseUUIDPipe) id: string) {
    return this.hospitalService.verifyHospital(id);
  }

  @Patch(':id/reject')
  @ApiPost('hospital rejection endpoint', RejectHospitalDto)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ResponseMessage('hospital verification rejected')
  @Roles(UserRole.ADMIN)
  async rejectHospital(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectHospitalDto,
  ) {
    return this.hospitalService.rejectHospital(id, dto);
  }



@Post(':id/images')
@UseGuards(JwtAuthGuard, RolesGuard, HospitalOwnershipGuard)
@Roles(UserRole.HOSPITAL, UserRole.ADMIN)
@UseInterceptors(FilesInterceptor('images', 5, imageUploadOptions))
async uploadImages(
  @Req() req: any,
  @UploadedFiles() files: Express.Multer.File[],
) {
  return this.hospitalService.uploadImages(req.hospital, files);
}
}
