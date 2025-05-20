import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessUserInputDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recording: string;
}
