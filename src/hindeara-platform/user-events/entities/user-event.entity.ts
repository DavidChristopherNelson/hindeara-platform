// src/hindeara-platform/user-events/entities/user-event.entity.ts
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user-events')
export class UserEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bytea' })
  recording: Buffer;

  @Column()
  locale: string;

  @Column({ nullable: true })
  transcription?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  previousRequestReceivedByFrontendAt?: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  requestSentFromFrontendAt?: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  requestReceivedByBackendAt?: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}
