import { Injectable, NotFoundException } from '@nestjs/common';
import { Doctor } from './doctor.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
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
      totalPages: Math.floor(total / limit)  || 1,
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
}
