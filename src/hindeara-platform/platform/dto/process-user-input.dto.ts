// src/hindeara-platform/platform/dto/process-user-input.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString } from 'class-validator';

export class ProcessUserInputDto {
  @ApiProperty()
  @IsString()
  recording: string;

  @ApiProperty()
  @IsString()
  @IsPhoneNumber('IN', {
    message: 'Please enter a valid Indian E.164 phone number',
  })
  phoneNumber: string;
}
