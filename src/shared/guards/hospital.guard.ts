// src/modules/hospitals/guards/hospital-ownership.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from 'src/modules/auth/entities/auth.entity';
import { Hospital } from "src/modules/hospitals/entities/hospital.entity";

@Injectable()
export class HospitalOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    
    const hospital = await this.hospitalRepository.findOne({
      where: { id: params.id },
    });

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    if (user.role === UserRole.ADMIN) {
      request.hospital = hospital;
      return true;
    }

    if (hospital.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this hospital',
      );
    }

    request.hospital = hospital;
    return true;
  }
}