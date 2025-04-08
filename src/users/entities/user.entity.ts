import { Event } from 'src/events/entities/event.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => Event, (event) => event.user)
  events?: Event[];
}
