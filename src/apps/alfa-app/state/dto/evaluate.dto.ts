import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EvaluateDto {
  @ApiProperty()
  @IsString()
  correctAnswer: string;

  @ApiProperty()
  @IsString()
  studentAnswer: string;
}
