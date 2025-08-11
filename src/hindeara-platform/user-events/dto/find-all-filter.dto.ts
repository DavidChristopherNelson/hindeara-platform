// src/hindeara-platform/user-events/dto/find-all-filter.dto.ts
import {
  IsOptional,
  IsInt,
  IsPositive,
  IsString,
  MinLength,
  IsDate,
} from 'class-validator';

export class FindAllUserEventsFilterDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  /** Strictly greater than (createdAt > since) in the service layer */
  @IsOptional()
  @IsDate()
  since?: Date;

  @IsOptional()
  @IsString()
  @MinLength(2)
  locale?: string;
}

export type FindAllUserEventsFilter = InstanceType<
  typeof FindAllUserEventsFilterDto
>;
