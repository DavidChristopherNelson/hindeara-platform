import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// Adjust import paths to your project structure
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { Phoneme } from 'src/apps/alfa-app/phonemes/entities/phoneme.entity';

@Entity({ name: 'user_phoneme_score' })
@Unique('uq_user_phoneme', ['userId', 'phonemeId'])
export class UserPhonemeScore {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  @Index()
  userId!: number;

  @Column({ type: 'int' })
  @Index()
  phonemeId!: number;

  // numeric → TypeORM returns string to preserve precision
  @Column({ type: 'numeric', precision: 6, scale: 3, default: 1 })
  value!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: User;

  @ManyToOne(() => Phoneme, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phonemeId', referencedColumnName: 'id' })
  phoneme!: Phoneme;
}
