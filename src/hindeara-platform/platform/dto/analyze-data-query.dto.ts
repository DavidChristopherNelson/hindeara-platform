// src/hindeara-platform/platform/dto/analyze-data-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPhoneNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyzeDataQueryDto {
  @ApiPropertyOptional({ description: 'User phone number to filter by' })
  @IsOptional()
  @IsString()
  @IsPhoneNumber('IN', {
    message: 'Please enter a valid Indian E.164 phone number',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Time window (e.g., minutes)', example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeWindow?: number;
}
