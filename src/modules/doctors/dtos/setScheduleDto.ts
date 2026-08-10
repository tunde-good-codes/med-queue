



import { PartialType, OmitType } from '@nestjs/swagger';



import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class DayScheduleDto {
  @IsInt() @Min(0) @Max(6)
  dayOfWeek: number;

  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm' })
  endTime: string;

  @IsOptional() @IsInt() @Min(5) @Max(240)
  slotDurationMinutes?: number = 30;

  @IsOptional() @IsInt() @Min(1) @Max(50)
  maxPatientsPerSlot?: number = 1;

  @IsOptional() @IsBoolean()
  isActive?: boolean = true;
}

export class SetScheduleDto {
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  days: DayScheduleDto[];
}

export class UpdateScheduleDayDto extends PartialType(
  OmitType(DayScheduleDto, ['dayOfWeek'] as const),
) {}