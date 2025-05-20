import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppEventDto {
  @ApiProperty()
  @IsString()
  recording: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  uiData: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isComplete: boolean;
}
