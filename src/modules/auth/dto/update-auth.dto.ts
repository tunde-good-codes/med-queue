import { PartialType } from '@nestjs/swagger';
import { RegisterUserDto } from './create-user.dto';

export class UpdateAuthDto extends PartialType(RegisterUserDto) {}
