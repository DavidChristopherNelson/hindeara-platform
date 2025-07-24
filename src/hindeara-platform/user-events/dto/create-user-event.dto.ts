// src/hindeara-platform/user-events/dto/create-user-event.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserEventDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recording: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  locale: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transcription?: string;
}
