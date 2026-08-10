import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from 'src/shared/guards/JwtAuthGuard';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';
import { ApiDelete, ApiGetService, ApiUpdate } from 'src/shared/decorators/swagger-docs.decorators';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';

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
  async allDoctors( @Query() dto: PaginationQueryDto) {
    return this.doctorService.getAllDoctors(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/update-doctor")
  @ResponseMessage("update doctors successfully")
  @ApiUpdate("update doctor records", UpdateDoctorDto)
  async updateDoctor(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorService.updateDoctor(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @ResponseMessage("delete doctors successfully")
  @ApiDelete("delete doctor records")
  async deleteDoctor(@Param("id", ParseUUIDPipe) id:string) {
    return this.doctorService.deleteDoctor(id);
  }
}
