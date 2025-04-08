import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.events)
  user: User;
}
