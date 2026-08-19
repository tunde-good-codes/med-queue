import { UpdateHospitalDto } from './dtos/update-hospital.dto';
import {
  Body,
  Controller,
  Delete,
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
  ApiCreate,
  ApiDelete,
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from 'src/shared/config/multer.config';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dtos/create-department-dto';

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

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOSPITAL)
  @ApiGetService('get my hospital')
  @ResponseMessage('hospital fetched successfully')
  async getMyHospital(@Req() req: any) {
    return this.hospitalService.myHospital(req.user.id);
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



    // @Get('')
    // @UseGuards(JwtAuthGuard)
    // @ResponseMessage('all hospitals fetched')
    // @ApiGetService('get all  hospitals')
    // findAllHospitals(@Query() query: PaginationQueryDto) {
    //   return this.hospitalService.findAllHospitals(query);
    // }
  
  @Delete(':id')
  @ResponseMessage('hospital deleted')
  @UseGuards(JwtAuthGuard, HospitalOwnershipGuard, RolesGuard)
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  @ApiDelete('delete a hospital')
  async deleteHospital(@Param('id', ParseUUIDPipe) id: string) {
    return this.hospitalService.deleteHospital(id);
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

  @Post(':id/add-department')
  @UseGuards(JwtAuthGuard, HospitalOwnershipGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HOSPITAL)
  @ResponseMessage('added a new department to hospital')
  @ApiCreate('create a new department for hospital', CreateDepartmentDto)
  async addDepartment(@Req() req, @Body() dto: CreateDepartmentDto) {
    return this.hospitalService.addDepartment(req.hospital, dto);
  }

  @Get(':id/get-departments')
  @ApiGetService('get all hospital departments')
  @ResponseMessage('all department fetched')
  async getDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.hospitalService.getDepartments(id);
  }

  @Get(':id/department/:departmentId')
  @ResponseMessage('get single department')
  @ApiGetService('Get single Department')
  async getSingleDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
  ) {
    return this.hospitalService.getSingleDepartment(id, departmentId);
  }
  @Patch(':id/department/:departmentId')
  @ResponseMessage('department updated successfully')
  @ApiCreate('Update hospital department', UpdateDepartmentDto)
  @UseGuards(JwtAuthGuard, HospitalOwnershipGuard, RolesGuard)
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  async updateDepartment(
    @Req() req: any,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.hospitalService.updateDepartment(
      req.hospital,
      departmentId,
      dto,
    );
  }

  @Delete(':id/department/:departmentId')
  @ResponseMessage('hospital deleted')
  @UseGuards(JwtAuthGuard, HospitalOwnershipGuard, RolesGuard)
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  @ApiDelete('delete a hospital')
  async deleteHospitalDepartment(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Req() req: any,
  ) {
    return this.hospitalService.deleteHospitalDepartment(
      departmentId,
      req.hospital,
    );
  }
}
