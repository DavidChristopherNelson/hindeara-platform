import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Phoneme } from '../../phonemes/entities/phoneme.entity';

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

  @Column()
  state: string;

  @ManyToOne(() => Phoneme, (phoneme) => phoneme.miniLessons)
  @JoinColumn()
  phoneme: Phoneme;
}
