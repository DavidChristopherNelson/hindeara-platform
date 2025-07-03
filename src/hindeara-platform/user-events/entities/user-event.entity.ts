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

  @Column()
  recording: Buffer;

  @Column()
  locale: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}
