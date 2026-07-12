import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { RegisterUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { Auth } from './entities/auth.entity';
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
import { version } from 'os';
import { UAParser } from 'ua-parser-js';
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
    const user = await this.authRepository.findOne({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new ConflictException('email or password is invalid');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Verify email address before login');
    }

    let isPassword;
    if (user.password) {
      isPassword = bcrypt.compare(loginDto.password, user.password);
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
  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
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
