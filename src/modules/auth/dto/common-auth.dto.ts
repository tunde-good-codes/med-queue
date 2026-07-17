import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  password:string
}
export class ChangePasswordDto {

  @IsString()
  @IsNotEmpty()
  password:string

  @IsString()
  @IsNotEmpty()
  newPassword:string
}
