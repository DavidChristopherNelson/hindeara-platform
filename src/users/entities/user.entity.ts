import { Event } from 'src/events/entities/event.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Event, (event) => event.user)
  events?: Event[];
}
