import { User } from 'src/users/entities/user.entity';
import { App } from 'supertest/types';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('app-events')
export class AppEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recording: string;

  @Column()
  uiData: string;

  @Column()
  is_complete: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.appEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => App, (app) => app.appEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  app: App;
}
