import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Doctor } from './doctor.entity';
import { Not, Repository } from 'typeorm';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from './schedule.entity';
import { SetScheduleDto, UpdateScheduleDayDto } from './dtos/setScheduleDto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
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

  async getDoctorById(id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: {
        id,
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
    });

    if (!doctors || doctors.length === 0) {
      throw new NotFoundException('doctors not found');
    }

    return {
      total,
      totalPages: Math.floor(total / limit) || 1,
      page,
      limit,
      doctors,
    };
  }

  async updateDoctor(id: string, dto: UpdateDoctorDto) {
    const doctor = await this.doctorRepository.findOne({
      where: {
        id,
      },
    });

    if (!doctor) {
      throw new NotFoundException('no doctor found with this id');
    }

    Object.assign(doctor, dto);

    await this.doctorRepository.save(doctor);
    return { doctor };
  }

  async deleteDoctor(id: string) {
    const result = await this.doctorRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('unable to delete doctor with this id');
    }

    return {
      message: 'doctor deleted',
    };
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
