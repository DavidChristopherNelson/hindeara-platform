import { User } from 'src/users/entities/user.entity';
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
  recording: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}
