import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { UserRole } from 'src/modules/auth/entities/auth.entity';
import { Doctor } from 'src/modules/doctors/doctor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DoctorAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { user, params } = request;
    const doctor = await this.doctorRepository.findOne({
      where: {
        id: params.id,
      },
    });

    if (!doctor) {
      throw new NotFoundException('no doctor found with this id');
    }

    if (user.role === UserRole.ADMIN) {
      request.doctor = doctor;

      return true;
    }

    if (doctor.userId !== user.id) {
      throw new ForbiddenException("you can't access this endpoint");
    }

    request.doctor = doctor;
    return true;
  }
}
