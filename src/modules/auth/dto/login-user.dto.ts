import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email address is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'min of 6 characters required' })
  password: string;
}
