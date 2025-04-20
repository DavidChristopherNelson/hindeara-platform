// src/hindeara-platform/phonemes/dto/phoneme.dto.ts
import { Expose, Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import type { Phoneme } from '../entities/phoneme.entity';

export class PhonemeDto {
  @Expose()
  id!: number;

  /** example_noun → exampleNoun */
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): string => (obj as Phoneme).example_noun,
    { toClassOnly: true },
  )
  exampleNoun!: string;

  /** example_image → exampleImage */
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): string => (obj as Phoneme).example_image,
    { toClassOnly: true },
  )
  exampleImage!: string;

  /** is_active → isActive */
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): boolean => (obj as Phoneme).is_active,
    { toClassOnly: true },
  )
  isActive!: boolean;

  /** MiniLesson[] → number[] */
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
