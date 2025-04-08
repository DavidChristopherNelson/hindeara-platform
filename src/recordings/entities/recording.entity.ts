import { Event } from 'src/events/entities/event.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bytea' })
  recording: Buffer;

  @OneToOne(() => Event, (event) => event.recording)
  @JoinColumn()
  event: Event;
}
