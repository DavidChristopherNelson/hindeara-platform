import { User } from 'src/users/entities/user.entity';
import { AppInstance } from 'src/app-instances/entities/app-instance.entity';
import { Recording } from 'src/recordings/entities/recording.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @OneToOne(() => AppInstance, (appInstance) => appInstance.event, {
    nullable: true,
  })
  appInstance?: AppInstance;

  @OneToOne(() => Recording, (recording) => recording.event, {
    nullable: true,
  })
  recording?: Recording;
}
