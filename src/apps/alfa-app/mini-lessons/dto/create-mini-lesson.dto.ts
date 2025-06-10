import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { LessonSnapshot } from '../entities/mini-lesson.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMiniLessonDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  appEventId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  word: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  locale: string;

  @ApiProperty()
  @IsNotEmpty()
  state: LessonSnapshot;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  phonemeId?: number;
}
