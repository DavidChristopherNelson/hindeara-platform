import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('apps')
export class App {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  http_path: string;

  @Column()
  is_active: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => AppEvent, (appEvent) => appEvent.app)
  appEvents: AppEvent[];
}
