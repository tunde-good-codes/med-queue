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
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { UpdateAuthDto } from './dto/update-auth.dto';
import { RegisterUserDto } from './dto/create-user.dto';
import { ResponseMessage } from 'src/shared/decorators/response.message.decorator';
import {
  ApiCreate,
  ApiGetService,
  ApiPost,
} from 'src/shared/decorators/swagger-docs.decorators';
import { VerifyOtpDto } from './dto/verify-otp-dto';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login-user.dto';
import { GoogleAuthGuard } from 'src/shared/guards/google-auth';
import type { Request, Response } from 'express';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto/common-auth.dto';
import { JwtAuthGuard } from 'src/shared/guards/JwtAuthGuard';

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

  @ApiPost('login to med-queue', LoginDto)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiCreate('Authenticate credentials and track session footprint', LoginDto)
  login(@Body() loginDto: LoginDto, @Req() request: Request, @Ip() ip: string) {
    const userAgent = request.headers['user-agent'] || 'Unknown Device';
    return this.authService.login(loginDto, userAgent, ip);
  }

  @ResponseMessage('google user created successfully')
  @ApiGetService('create a new google user')
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // The guard handles redirection automatically
  }
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: Request,
    @Ip() ip: string,
    @Res() res: Response,
  ) {
    const googleUser = req.user as any;
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    const result = await this.authService.validateOrCreateGoogleUser(
      googleUser,
      userAgent,
      ip,
    );

    const frontendUrl = `http://localhost:5173/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

    return res.redirect(frontendUrl);
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokenUpdate(dto);
  }

  @Get('me')
  @ApiGetService('get a signed in user')
  @ResponseMessage('user fetched')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @ApiPost('enter email to trigger this process', ForgotPasswordDto)
  @ResponseMessage('email sent to user')
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(dto);
  }

  @ApiPost('provide otp and password trigger this process', ForgotPasswordDto)
  @ResponseMessage('password reset completed')
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.authService.resetPassword(dto);
  }

  @ApiGetService('logout user')
  @ResponseMessage('this user has been logged out')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logOut(@Req() req: any) {
    return await this.authService.logout(req.user.id);
  }

  @ApiGetService('delete a  user')
  @ResponseMessage('this user has been deleted')
  @Delete('delete-user/:id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.authService.deleteUser(id);
  }
  @Get('users')
  @ResponseMessage('all users fetched')
  @ApiGetService('get all  user')
  findAll() {
    return this.authService.findAllUser();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @ApiPost('change password', ChangePasswordDto)
  @ResponseMessage('password changed completed')
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return await this.authService.changePassword(req.user.id, dto);
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
