import {
  BadRequestException,
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
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { Department } from './entities/department.entity';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dtos/create-department-dto';
@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
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
      page,
      limit,
      totalPages: Math.floor(total / limit),
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

  async uploadImages(
    hospital: Hospital,
    files: Express.Multer.File[],
  ): Promise<Hospital> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    const totalAfter = hospital.images.length + files.length;
    if (totalAfter > 5) {
      throw new BadRequestException(
        `Upload would exceed the 5-image limit (currently has ${hospital.images.length}, tried to add ${files.length})`,
      );
    }
    const folder = this.configService.getOrThrow<string>('CLOUDINARY_FOLDER');
    const uploaded = await Promise.all(
      files.map((file) =>
        this.cloudinaryService.upload(
          file,
          `${folder}/hospitals/${hospital.id}`,
        ),
      ),
    );

    hospital.images = [...hospital.images, ...uploaded];
    return await this.hospitalRepository.save(hospital);
  }

  async addDepartment(hospital: Hospital, dto: CreateDepartmentDto) {
    const existingDepartment = await this.departmentRepository.findOne({
      where: {
        hospitalId: hospital.id,
        name: dto.name,
      },
    });

    if (existingDepartment) {
      throw new ConflictException(
        `This hospital already has a department named "${dto.name}"`,
      );
    }

    const department = this.departmentRepository.create({
      hospitalId: hospital.id,
      ...dto,
    });

    await this.departmentRepository.save(department);
    return { department };
  }

  async getDepartments(hospitalId: string) {
    const hospital = this.hospitalRepository.findOne({
      where: {
        id: hospitalId,
      },
    });
    if (!hospital) {
      throw new NotFoundException('No Hospital found ');
    }

    const departments = await this.departmentRepository.find({
      where: {
        hospitalId,
      },
      order: { createdAt: 'desc' },
    });

    if (!departments || departments.length === 0) {
      throw new NotFoundException('no department for this hospital');
    }

    return {
      departments,
    };
  }

  async updateDepartment(
    hospital: Hospital,
    departmentId: string,
    dto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentRepository.findOne({
      where: {
        id: departmentId,
        hospitalId: hospital.id,
      },
    });

    if (!department) {
      throw new NotFoundException(
        'cant find department with this id in the hospital',
      );
    }

    if (dto.name && dto.name !== department.name) {
      const duplicate = await this.departmentRepository.findOne({
        where: {
          hospitalId: hospital.id,
          name: dto.name,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'a department with this already exist for the hospital',
        );
      }

      Object.assign(department, dto);
    }
    await this.departmentRepository.save(department);

    return { department };
  }
}
