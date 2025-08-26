// src/apps/alfa-app/phonemes/entities/phoneme.entity.ts
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MiniLesson } from '../../mini-lessons/entities/mini-lesson.entity';

@Entity('phoneme')
@Unique(['letter'])
export class Phoneme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  letter: string;

  @Column()
  example_noun: string;

  @Column()
  example_image: string;

  @Column()
  is_active: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => MiniLesson, (miniLesson) => miniLesson.phoneme)
  miniLessons: MiniLesson[];
}
