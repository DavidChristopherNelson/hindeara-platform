// src/hindeara-platform/users/entities/user.entity.ts
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { UserEvent } from 'src/hindeara-platform/user-events/entities/user-event.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({})
  phoneNumber: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => UserEvent, (userEvent) => userEvent.user)
  userEvents?: UserEvent[];

  @OneToMany(() => AppEvent, (appEvent) => appEvent.user)
  appEvents?: AppEvent[];
}
