// src/hindeara-platform/phonemes/dto/phoneme.dto.ts
import { Expose, Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import type { Phoneme } from '../entities/phoneme.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PhonemeDto {
  @ApiProperty()
  @Expose()
  id!: number;

  /** letter → letter */
  @ApiProperty()
  @Expose()
  letter!: string;

  /** example_noun → exampleNoun */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): string => (obj as Phoneme).example_noun,
    { toClassOnly: true },
  )
  exampleNoun!: string;

  /** example_image → exampleImage */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): string => (obj as Phoneme).example_image,
    { toClassOnly: true },
  )
  exampleImage!: string;

  /** is_active → isActive */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): boolean => (obj as Phoneme).is_active,
    { toClassOnly: true },
  )
  isActive!: boolean;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  /** MiniLesson[] → number[] */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): number[] => {
      const lessons = (obj as Phoneme).miniLessons;
      return Array.isArray(lessons) ? lessons.map((l) => l.id) : [];
    },
    { toClassOnly: true },
  )
  miniLessonIds!: number[];
}
