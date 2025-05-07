import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Phoneme } from '../../phonemes/entities/phoneme.entity';
import { LessonSnapshot } from '../entities/mini-lesson.entity';

export class CreateMiniLessonDto {
  @IsNotEmpty()
  @IsNumber()
  appEventId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  word: string;

  @IsNotEmpty()
  state: LessonSnapshot;

  @IsOptional()
  phoneme?: Phoneme;
}
