import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Hospital } from './entities/hospital.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateHospitalDto } from './dtos/update-hospital.dto';
import slugify from 'slugify';
@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {}

  async getAllHospital() {
    const [hospitals, total] = await this.hospitalRepository.findAndCount();

    if (!hospitals || hospitals.length === 0) {
      return 'no hospital found';
    }

    return {
      total,
      hospitals,
    };
  }

  async getSingleHospital(id: string) {
    const hospital = this.hospitalRepository.findOne({
      where: {
        id,
      },
    });

    if (!hospital) {
      throw new ConflictException('No hospital matched with this id');
    }

    return hospital;
  }
  async getHospitalBySlug(slug: string) {
    const hospital = this.hospitalRepository.findOne({
      where: {
        slug,
      },
    });

    if (!hospital) {
      throw new ConflictException('No hospital matched with this slug');
    }

    return hospital;
  }

  async updateHospitalProfile(id: string, dto: UpdateHospitalDto) {
    const hospital = await this.hospitalRepository.findOne({
      where: {
        id,
      },
    });

    if (!hospital) {
      throw new ConflictException('You are not authorized to update this');
    }

    if (dto.licenseNumber && dto.licenseNumber !== hospital.licenseNumber) {
      const duplicateLicenseNumber = await this.hospitalRepository.findOne({
        where: {
          licenseNumber: dto.licenseNumber,
        },
      });

      if (duplicateLicenseNumber) {
        throw new ConflictException(
          'A hospital with this license number exists',
        );
      }
    }

    if (dto.hospitalName && dto.hospitalName !== hospital.name) {
      hospital.name = dto.hospitalName;
      hospital.slug = slugify(dto.hospitalName, { lower: true });
    }

    const { hospitalName, ...otherDto } = dto;

    Object.assign(hospital, dto);

    await this.hospitalRepository.save(hospital);

    return {
      hospital,
    };
  }
}
