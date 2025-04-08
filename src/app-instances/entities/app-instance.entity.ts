import { HindearaEvent } from 'src/hindeara-events/entities/hindeara-event.entity';
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

  @OneToOne(() => HindearaEvent, (hindearaEvent) => hindearaEvent.appInstance)
  @JoinColumn()
  hindearaEvent: HindearaEvent;

  @ManyToOne(() => App, (app) => app.appInstances)
  @JoinColumn()
  app: App;
}
