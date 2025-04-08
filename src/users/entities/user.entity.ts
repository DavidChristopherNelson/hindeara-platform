import { HindearaEvent } from 'src/hindeara-events/entities/hindeara-event.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => HindearaEvent, (hindearaEvent) => hindearaEvent.user)
  hindearaEvents?: HindearaEvent[];
}
