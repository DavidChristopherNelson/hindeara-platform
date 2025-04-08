import { Event } from 'src/events/entities/event.entity';
import { App } from 'src/apps/entities/app.entity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @OneToOne(() => Event, (event) => event.app_instance)
  @JoinColumn()
  event: Event;

  @ManyToOne(() => App, (app) => app.appInstances)
  app: App;
}
