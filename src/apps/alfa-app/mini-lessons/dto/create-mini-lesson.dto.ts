import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Phoneme } from '../../phonemes/entities/phoneme.entity';

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
  @IsString()
  state: string;

  @IsNotEmpty()
  phoneme: Phoneme;
}
