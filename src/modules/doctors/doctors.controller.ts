import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/shared/guards/JwtAuthGuard';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';
import {
  ApiDelete,
  ApiGetService,
  ApiUpdate,
} from 'src/shared/decorators/swagger-docs.decorators';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { DoctorAuthGuard } from 'src/shared/guards/doctor.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserRole } from '../auth/entities/auth.entity';
import { SetScheduleDto, UpdateScheduleDayDto } from './dtos/setScheduleDto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorService: DoctorsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('my doctor data')
  @ApiGetService('get doctor data of this user')
  async getLoggedInDoctor(@Req() req: any) {
    return this.doctorService.loggedInDoctor(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('single doctor data fetched')
  @ApiGetService('a doctor data of this user')
  async getDoctorById(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @Get()
  @ApiGetService('get all doctors')
  @ResponseMessage('doctors fetched successfully!')
  async allDoctors(@Query() dto: PaginationQueryDto) {
    return this.doctorService.getAllDoctors(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/update-doctor')
  @ResponseMessage('update doctors successfully')
  @ApiUpdate('update doctor records', UpdateDoctorDto)
  async updateDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorDto,
  ) {
    return this.doctorService.updateDoctor(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ResponseMessage('delete doctors successfully')
  @ApiDelete('delete doctor records')
  async deleteDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.deleteDoctor(id);
  }

  @Post(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard, DoctorAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ResponseMessage('schedule set successfully')
  async setSchedule(@Req() req: any, @Body() dto: SetScheduleDto) {
    return this.doctorService.setSchedule(req.doctor, dto);
  }

  @Patch(':id/schedule/:day')
  @UseGuards(JwtAuthGuard, RolesGuard, DoctorAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ResponseMessage('schedule day updated')
  async updateScheduleDay(
    @Req() req: any,
    @Param('day', ParseIntPipe) day: number,
    @Body() dto: UpdateScheduleDayDto,
  ) {
    return this.doctorService.updateScheduleDay(req.doctor,  dto, day);
  }

  @Get(':id/schedule')
  @ResponseMessage('schedule fetched')
  async getSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.doctorService.getSchedule(id, query);
  }
}
