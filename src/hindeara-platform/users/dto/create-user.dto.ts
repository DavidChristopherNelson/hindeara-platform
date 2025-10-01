// src/hindeara-platform/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsPhoneNumber } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Indian E.164 phone number',
    example: '+911234567890',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('IN', {
    message: 'Please enter a valid Indian E.164 phone number.',
  })
  phoneNumber!: string;

  @ApiProperty({ required: false, description: "User's display name" })
  @IsString()
  @IsOptional()
  name?: string;
}
