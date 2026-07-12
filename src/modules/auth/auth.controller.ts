import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Req,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { UpdateAuthDto } from './dto/update-auth.dto';
import { RegisterUserDto } from './dto/create-user.dto';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';
import { ApiCreate, ApiPost } from 'src/shared/decorators/swagger-docs.decorators';
import { VerifyOtpDto } from './dto/verify-otp-dto';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login-user.dto';

@ApiTags('auth service')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ResponseMessage('user created successfully')
  @ApiCreate('create a new user', RegisterUserDto)
  @Post('sign-up')
  create(@Body() createAuthDto: RegisterUserDto) {
    return this.authService.registerNewUser(createAuthDto);
  }

  @ResponseMessage('user verified successfully')
  @ApiCreate('verify a new user', VerifyOtpDto)
  @Post('verify')
  verifyUser(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @ApiPost("login to med-queue", LoginDto)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiCreate('Authenticate credentials and track session footprint', LoginDto)
  login(@Body() loginDto: LoginDto, @Req() request: Request, @Ip() ip: string) {
    const userAgent = request.headers['user-agent'] || 'Unknown Device';
    return this.authService.login(loginDto, userAgent, ip);
  }
  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
