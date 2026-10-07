import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from 'src/modules/auth/entities/auth.entity';
import { QueueRepo } from "src/modules/queue/entities/queue";
import { Doctor } from "src/modules/doctors/doctor.entity";

@Injectable()
export class QueueAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(QueueRepo) private readonly queueRepository: Repository<QueueRepo>,
    @InjectRepository(Doctor) private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    const entry = await this.queueRepository.findOne({ where: { id: params.id } });
    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }

    if (user.role === UserRole.ADMIN) {
      request.queueEntry = entry;
      return true;
    }

    const doctor = await this.doctorRepository.findOne({ where: { userId: user.id } });
    if (!doctor || doctor.id !== entry.doctorId) {
      throw new ForbiddenException('You do not manage this queue entry');
    }

    request.queueEntry = entry;
    return true;
  }
}