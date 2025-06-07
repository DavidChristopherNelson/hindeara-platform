import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserEventDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recording: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  locale: string;
}
