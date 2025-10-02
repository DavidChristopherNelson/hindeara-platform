// src/hindeara-platform/platform/dto/process-user-input.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class ProcessUserInputDto {
  @ApiProperty()
  @IsString()
  recording: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('IN', {
    message: 'Please make sure the phone number is a valid Indian E.164',
  })
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  textInput?: string;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  previousRequestReceivedAt?: Date;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  requestSentAt?: Date;
}
