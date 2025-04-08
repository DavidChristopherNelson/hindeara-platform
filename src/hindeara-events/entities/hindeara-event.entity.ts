import { User } from 'src/users/entities/user.entity';
import { AppInstance } from 'src/app-instances/entities/app-instance.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('hindeara-events')
export class HindearaEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bytea' })
  recording: Buffer;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.hindearaEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @OneToOne(() => AppInstance, (appInstance) => appInstance.hindearaEvent, {
    nullable: true,
  })
  appInstance?: AppInstance;
}
