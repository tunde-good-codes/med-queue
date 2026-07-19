import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/create-user.dto';
import { DataSource, Repository } from 'typeorm';
import { Auth, UserRole } from './entities/auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/infrastructure/mail/mail.service';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { VerifyOtpDto } from './dto/verify-otp-dto';
import { randomBytes, randomInt } from 'crypto';
import { LoginDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ValidatePayloadTypes } from './auth.types';
import { UAParser } from 'ua-parser-js';
import slugify from 'slugify';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto/common-auth.dto';
import { ForgotPasswordType } from 'src/types/auth';
import { RegisterHospitalDto } from '../hospitals/dtos/create-hospital.dto';
import { Hospital } from '../hospitals/entities/hospital.entity';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    private readonly mailService: MailService,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    private readonly datasource: DataSource,
  ) {}
  async registerNewUser(registerUserDto: RegisterUserDto) {
    const existingUser = await this.authRepository.findOne({
      where: {
        email: registerUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(registerUserDto.password, salt);

    const newUser = this.authRepository.create({
      ...registerUserDto,
      password: hashPassword,
      isVerified: false,
    });

    await this.authRepository.save(newUser);

    const redisKey = `otp:${registerUserDto.email}`;

    const otp = randomInt(100000, 999999).toString();

    await this.redisClient.set(redisKey, otp, 'EX', 300);

    this.mailService.sendVerificationOtp(
      registerUserDto.email,
      registerUserDto.firstName,
      otp,
    );
    return {
      message:
        'Registration Successful. Please check your email for verification code',
      email: registerUserDto.email,
      firstName: registerUserDto.firstName,
    };
  }

  async registerNewHospital(dto: RegisterHospitalDto) {
    const queryRunner = this.datasource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(Auth, {
        where: {
          email: dto.email,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12);
      const user = queryRunner.manager.create(Auth, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        phoneNumber: dto.phone,
        role: UserRole.HOSPITAL,
        isVerified: false,
      });
      const slug = slugify(dto.hospitalName, {
        lower: true,
      });
      const savedUser = await queryRunner.manager.save(Auth, user);
      const hospital = queryRunner.manager.create(Hospital, {
        userId: savedUser.id,
        name: dto.hospitalName,
        type: dto.type,
        licenseNumber: dto.licenseNumber,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        city: dto.city,
        state: dto.state,
        streetAddress: dto.streetAddress,
        zipCode: dto.zipCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        operatingHours: dto.operatingHours,
        acceptedInsuranceProviders: dto.acceptedInsuranceProviders,
        maxCapacity: dto.maxCapacity,
        slug,
      });

      await queryRunner.manager.save(Hospital, hospital);
      const otp = randomInt(100000, 999999).toString();

      const redisKey = `otp:${dto.email}`;
      await this.redisClient.set(redisKey, otp, 'EX', 300);

      this.mailService.sendVerificationOtp(dto.email, dto.firstName, otp);
      await queryRunner.commitTransaction();

      return {
        message:
          'Registration successful. Please check your email for verification code',
        email: dto.email,
        hospitalName: dto.hospitalName,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const redisKey = `otp:${verifyOtpDto.email}`;
    const savedOtp = await this.redisClient.get(redisKey);

    if (!savedOtp) {
      throw new NotFoundException(
        'otp code not found or not attached to this email',
      );
    }

    if (savedOtp !== verifyOtpDto.cryptoOtp) {
      throw new ConflictException('Invalid or expired otp code');
    }

    const user = await this.authRepository.findOne({
      where: {
        email: verifyOtpDto.email,
      },
    });
    if (!user) {
      throw new BadRequestException(
        'user record associate with this email not found',
      );
    }
    user.isVerified = true;
    await this.authRepository.save(user);

    await this.redisClient.del(redisKey);

    return {
      message:
        'Email address verified successfully. Your account is active now',
    };
  }

  async login(loginDto: LoginDto, userAgentString: string, ipAddress: string) {
    const user = await this.authRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: loginDto.email })
      .getOne();

    if (!user?.password) {
      throw new ConflictException('email or password is invalid');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Verify email address before login');
    }

    let isPassword;
    if (user.password) {
      isPassword = await bcrypt.compare(loginDto.password, user.password);
    }

    if (!isPassword) {
      throw new ConflictException('password mismatched');
    }
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    const parser = new UAParser(userAgentString);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const deviceType = parser.getDevice().type || 'Desktop';
    const deviceName = `${browser} on ${os} (${deviceType})`;

    const { accessToken, refreshToken } = await this.generateTokens(payload);

    const sessionIdentifier = Date.now().toString();
    const redisSessionKey = `user:sessions:${user.id}:${sessionIdentifier}`;

    const sessionMetadata = {
      deviceName,
      ipAddress,
      refreshToken,
      createdAt: new Date().toISOString(),
    };

    await this.redisClient.set(
      redisSessionKey,
      JSON.stringify(sessionMetadata),
      'EX',
      604800,
    );
    return {
      message: 'login successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      sessionMetadata: {
        deviceName: sessionMetadata.deviceName,
        ipAddress: sessionMetadata.ipAddress,
      },
      accessToken,
      refreshToken,
    };
  }

  async validateOrCreateGoogleUser(
    googleUser: {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
      profileImage: string;
    },
    userAgentString: string,
    ipAddress: string,
  ) {
    // 1. Look up existing user
    let user = await this.authRepository.findOne({
      where: {
        email: googleUser.email,
      },
    });

    if (user) {
      // SCENARIO A: User exists but hasn't linked Google yet
      if (!user.googleId) {
        user.googleId = googleUser.googleId;

        if (googleUser.profileImage && !user.profileImage) {
          user.profileImage = googleUser.profileImage;
        }
        if (!user.isVerified) {
          user.isVerified = true;
        }
        user = await this.authRepository.save(user);
      }
    } else {
      // SCENARIO B: User does not exist at all -> Create a brand new account
      const newUser = this.authRepository.create({
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        email: googleUser.email,
        profileImage: googleUser.profileImage,
        googleId: googleUser.googleId,
        isVerified: true,
        role: UserRole.PATIENT,
      });

      user = await this.authRepository.save(newUser);
    }

    const parser = new UAParser(userAgentString);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const deviceType = parser.getDevice().type || 'Desktop';
    const deviceName = `${browser} on ${os} (${deviceType})`;

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const { accessToken, refreshToken } = await this.generateTokens(payload);

    const sessionIdentifier = Date.now().toString();
    const redisSessionKey = `user:sessions:${user.id}:${sessionIdentifier}`;

    const sessionMetadata = {
      deviceName,
      ipAddress,
      refreshToken: refreshToken,
      createdAt: new Date().toISOString(),
    };

    await this.redisClient.set(
      redisSessionKey,
      JSON.stringify(sessionMetadata),
      'EX',
      604800,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        id: user.id,
      },
    };
  }

  async refreshTokenUpdate(token: RefreshTokenDto) {
    let decoded: any;

    try {
      decoded = await this.jwtService.verifyAsync(token.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('session timed out. log in again');
    }

    const user = await this.authRepository.findOne({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      throw new BadRequestException('Session Timed Out. Sign in again');
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Session Timed out. Sign Again');
    }
    const payload: ValidatePayloadTypes = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const { accessToken, refreshToken } = await this.generateTokens(payload);

    return { accessToken, refreshToken };
  }

  async changePassword(id: string, dto: ChangePasswordDto) {

    
    const user = await this.authRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id=:id', {
        id,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException(
        'you are not authorized to access this endpoint',
      );
    }
    if (!user.password) {
      throw new BadRequestException(
        'this account probably uses a google account. activate recovery on google',
      );
    }
    let isPasswordCorrect: any;

    if (user.password) {
      isPasswordCorrect = await bcrypt.compare(dto.password, user.password);
    }

    if (!isPasswordCorrect) {
      throw new BadRequestException('Old Password Mismatched or invalid');
    }

    const hashPassword = await bcrypt.hash(dto.newPassword, 12);

    user.password = hashPassword;
    user.tokenVersion += 1;
    await this.authRepository.save(user);
    return {
      message: 'password updated successfully',
    };
  }
  async logout(id: string) {
    await this.authRepository.update(id, {
      tokenVersion: () => `"tokenVersion" + 1`,
    });
    return {
      message: 'logout successfully',
    };
  }

  async getMe(id: string) {
    const user = await this.authRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('no user with the id');
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.authRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      return {
        message: `if this email exists, a message with the reset token has been sent to: ${dto.email}`,
      };
    }
    const resetToken = randomBytes(32).toString('hex');
    const redisKey = `password-reset:${resetToken}`;

    await this.redisClient.set(redisKey, user.email, 'EX', 300);
    const payload: ForgotPasswordType = {
      email: user.email,
      firstName: user.firstName,
      resetToken,
    };
    await this.mailService.sendForgotPasswordOtp(payload);

    return {
      message: `if this email exists, a message with the reset token has been sent to: ${dto.email}`,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const redisKey = `password-reset:${dto.token}`;
    const redisEmail = await this.redisClient.get(redisKey);

    if (!redisEmail) {
      throw new BadRequestException('Token invalid or expired');
    }

    if (redisEmail !== dto.email) {
      throw new BadRequestException('invalid email for this request');
    }
    const user = await this.authRepository.findOne({
      where: {
        email: redisEmail,
      },
    });

    if (!user) {
      throw new BadRequestException('invalid email for this request');
    }

    const hashPassword = await bcrypt.hash(dto.password, 12);

    user.password = hashPassword;
    user.tokenVersion += 1;

    await this.authRepository.save(user);
    await this.redisClient.del(redisKey);
    return {
      message: 'password reset successfully',
    };
  }

  async deleteUser(id: string) {
    const user = await this.authRepository.delete({
      id,
    });
    if (user.affected === 0) {
      throw new BadRequestException('invalid user id');
    }

    return {
      id,
    };
  }
  async findAllUser() {
    const [users, total] = await this.authRepository.findAndCount();
    if (!users || users.length === 0) {
      return 'No users found';
    }
    return {
      total,
      users,
    };
  }

  async generateTokens(payload: ValidatePayloadTypes) {
    const refreshTokenKey = randomBytes(16).toString('hex');

    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const accessTokenExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '15m',
    ) as string as any;
    const refreshTokenExpiresIn = this.configService.get<string>(
      'REFRESH_TOKEN_TTL',
      '7d',
    ) as string as any;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          tokenVersion: payload.tokenVersion,
        },
        {
          secret,
          expiresIn: accessTokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          tokenVersion: payload.tokenVersion,
          refreshTokenKey,
        },
        {
          secret,
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
