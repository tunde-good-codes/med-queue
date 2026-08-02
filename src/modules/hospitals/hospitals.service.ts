import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Hospital } from './entities/hospital.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateHospitalDto } from './dtos/update-hospital.dto';
import slugify from 'slugify';
import { HospitalVerificationStatus } from './hospital.types';
import { RejectHospitalDto } from './dtos/reject-hospital.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {}

  async getAllHospital(pagination: PaginationQueryDto) {
    const { limit = 10, page = 1 } = pagination;

    const skip = (page - 1) * limit;
    const [hospitals, total] = await this.hospitalRepository.findAndCount({
      // where: {
      //   verificationStatus: HospitalVerificationStatus.VERIFIED,
      // },
      order: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    if (!hospitals || hospitals.length === 0) {
      throw new NotFoundException('no hospital found at this time');
    }

    return {
      total,
      page,limit, totalPages : Math.floor(total/limit),
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
    const hospital = await this.hospitalRepository.findOne({ where: { id } });

    if (!hospital) {
      throw new NotFoundException('Hospital facility not found');
    }

    if (dto.licenseNumber && dto.licenseNumber !== hospital.licenseNumber) {
      const duplicateLicenseNumber = await this.hospitalRepository.findOne({
        where: { licenseNumber: dto.licenseNumber },
      });
      if (duplicateLicenseNumber) {
        throw new ConflictException(
          'A hospital with this license number exists',
        );
      }
    }

    // 1. Update the database column field directly
    if (dto.hospitalName && dto.hospitalName !== hospital.name) {
      hospital.name = dto.hospitalName;
      hospital.slug = slugify(dto.hospitalName, { lower: true });
    }

    // 2. Strip hospitalName out so it doesn't pollute the entity object instance
    const { hospitalName, ...otherDto } = dto;

    // 3. Safely map all other optional fields (phone, website, capacity, etc.)
    Object.assign(hospital, otherDto);

    // 4. Save the tracked changes to PostgreSQL
    return await this.hospitalRepository.save(hospital);
  }

  async verifyHospital(id: string) {
    const hospital = await this.hospitalRepository.findOne({
      where: {
        id,
      },
    });

    if (!hospital) {
      throw new NotFoundException('Hospital not found!');
    }

    if (hospital.verificationStatus === HospitalVerificationStatus.VERIFIED) {
      throw new ConflictException('Hospital is already verified');
    }

    hospital.verificationStatus = HospitalVerificationStatus.VERIFIED;
    hospital.rejectionReason = null;

    await this.hospitalRepository.save(hospital);

    return {
      hospital,
    };
  }

  async rejectHospital(id: string, dto: RejectHospitalDto) {
    const hospital = await this.hospitalRepository.findOne({
      where: {
        id,
      },
    });

    if (!hospital) {
      throw new NotFoundException('Hospital not found!');
    }

    if (hospital.verificationStatus === HospitalVerificationStatus.VERIFIED) {
      throw new ConflictException('Verified hospital cannot be rejected!');
    }

    hospital.verificationStatus = HospitalVerificationStatus.REJECTED;
    hospital.rejectionReason = dto.reason;

    await this.hospitalRepository.save(hospital);

    return { hospital };
  }
}
