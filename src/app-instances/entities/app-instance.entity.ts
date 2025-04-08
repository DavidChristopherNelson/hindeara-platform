import { Event } from 'src/events/entities/event.entity';
import { App } from 'src/apps/entities/app.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

enum AppStatus {
  USER_REQUEST = 'user_request',
  COMPLETE = 'complete',
  INCOMPLETE = 'incomplete',
}

@Entity('app_instances')
export class AppInstance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: AppStatus,
  })
  status: AppStatus;

  @OneToOne(() => Event, (event) => event.appInstance)
  @JoinColumn()
  event: Event;

  @ManyToOne(() => App, (app) => app.appInstances)
  @JoinColumn()
  app: App;
}
