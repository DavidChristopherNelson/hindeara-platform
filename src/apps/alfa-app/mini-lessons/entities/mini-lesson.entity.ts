import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Phoneme } from '../../phonemes/entities/phoneme.entity';
import { Snapshot } from 'xstate';

export type LessonSnapshot = Snapshot<unknown>;

@Entity('mini-lessons')
export class MiniLesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  appEventId: number;

  @Column()
  userId: number;

  @Column()
  word: string;

  @Column({
    type: 'simple-json',
  })
  state: Snapshot<unknown>;

  @ManyToOne(() => Phoneme, (phoneme) => phoneme.miniLessons)
  @JoinColumn()
  phoneme: Phoneme;
}
