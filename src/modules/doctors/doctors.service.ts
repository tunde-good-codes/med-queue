import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Doctor } from './doctor.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from './schedule.entity';
import { SetScheduleDto, UpdateScheduleDayDto } from './dtos/setScheduleDto';
import { Auth, UserRole } from '../auth/entities/auth.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly datasource: DataSource,
  ) {}

  async loggedInDoctor(id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: {
        userId: id,
      },
    });

    if (!doctor) {
      throw new NotFoundException('not authorized to fetch this doctor');
    }

    return { doctor };
  }

  async findAllDoctors(pagination: PaginationQueryDto) {
    const { page = 1, limit = 4 } = pagination;

    const skip = (page - 1) * limit;
    const [doctors, total] = await this.doctorRepository.findAndCount({
      skip,
      take: limit,
      order: {
        createdAt: 'desc',
      },
    });

    if (!doctors || doctors.length === 0) {
      throw new NotFoundException('no doctor found!');
    }

    return {
      total,
      totalPage: Math.ceil(total / limit),
      limit,
      doctors,
    };
  }
  async getDoctorById(id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: {
        id,
      },
      relations: {
        appointments: true,
        schedules: true,
      },
      select: {
        id: true,
        hospitalId: true,
        appointments: true,
        userId: true,
        licenseNumber: true,
        specialty: true,
        bio: true,
        rating: true,
        totalRatings: true,
        consultationFee: true,
        isAvailable: true,
        yearsOfExperience: true,
        schedules: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('no doctor found with this id');
    }

    return { doctor };
  }

  async getAllDoctors(pagination: PaginationQueryDto) {
    const { page = 1, limit = 6 } = pagination;
    const skip = (page - 1) * limit;
    const [doctors, total] = await this.doctorRepository.findAndCount({
      skip,
      take: limit,
      order: {
        createdAt: 'desc',
      },
      relations: {
        user: true,
        schedules: true,
      },
      select: {
        id: true,
        userId: true,
        hospitalId: true,
        departmentId: true,
        licenseNumber: true,
        specialty: true,
        bio: true,
        rating: true,
        consultationFee: true,
        isAvailable: true,
        totalRatings: true,
        yearsOfExperience: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          email: true,
        },
        schedules: {
          id: true,
        },
      },
    });

    if (!doctors || doctors.length === 0) {
      throw new NotFoundException('doctors not found');
    }

    return {
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
      doctors,
    };
  }

  async updateDoctor(doctor: Doctor, dto: UpdateDoctorDto) {
    const newDoc = await this.doctorRepository.findOne({
      where: {
        id: doctor.id,
      },
    });

    if (!newDoc) {
      throw new NotFoundException('no newDoc found with this id');
    }

    Object.assign(newDoc, dto);

    await this.doctorRepository.save(newDoc);
    return { newDoc };
  }

  async deleteDoctor(id: string) {
    const queryRunner = this.datasource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { id },
      });

      if (!doctor) {
        throw new NotFoundException('no doctor found with this id');
      }

      const result = await queryRunner.manager.delete(Auth, {
        id: doctor.userId,
      });

      if (result.affected === 0) {
        throw new NotFoundException('Associated user account not found');
      }

      await queryRunner.commitTransaction();
      return { message: 'Doctor account deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async setSchedule(doctor: Doctor, dto: SetScheduleDto) {
    for (const day of dto.days) {
      if (day.startTime >= day.endTime) {
        throw new BadRequestException(
          'start time must be greater than end time',
        );
      }
    }

    await this.scheduleRepository.delete({
      doctorId: doctor.id,
    });

    const schedules = dto.days.map((day) =>
      this.scheduleRepository.create({
        ...day,
        doctorId: doctor.id,
      }),
    );

    await this.scheduleRepository.save(schedules);

    return { schedules };
  }

  async updateScheduleDay(
    doctor: Doctor,
    dto: UpdateScheduleDayDto,
    dayOfWeek: number,
  ) {
    const schedule = await this.scheduleRepository.findOne({
      where: {
        doctorId: doctor.id,
        dayOfWeek,
      },
    });

    if (!schedule) {
      throw new NotFoundException('no schedule for the specified date');
    }

    const merged = {
      ...schedule,
      ...dto,
    };
    if (merged.startTime >= merged.endTime) {
      throw new BadRequestException('start time must be bigger than end time');
    }

    Object.assign(schedule, dto);

    return await this.scheduleRepository.save(schedule);
  }

  async getSchedule(doctorId: string, pagination: PaginationQueryDto) {
    const { page = 1, limit = 3 } = pagination;

    const skip = (page - 1) * limit;

    return await this.scheduleRepository.find({
      take: limit,
      skip,
      order: {
        dayOfWeek: 'DESC',
      },
      where: {
        doctorId,
      },
    });
  }
  async deleteSchedule(doctorId: string, dayOfWeek: number) {
    const result = await this.scheduleRepository.delete({
      doctorId,
      dayOfWeek,
    });

    if (result.affected === 0) {
      throw new BadRequestException('error deleting schedule');
    }

    return {
      message: 'schedule deleted',
    };
  }
}
