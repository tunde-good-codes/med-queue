import { Controller, Get } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetService } from 'src/shared/decorators/swagger-docs.decorators';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';

@Controller('hospital')
@ApiTags('Hospital Service')
export class HospitalsController {
  constructor(private readonly hospitalService: HospitalsService) {}

  @ApiGetService('get all hospitals')
  @ResponseMessage('all hospitals fetched')
  @Get("")
  async getAllHospital() {
    return this.hospitalService.getAllHospital();
  }
}
