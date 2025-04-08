import { AppInstance } from 'src/app-instances/entities/app-instance.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('apps')
export class App {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  http_path: string;

  @Column()
  is_active: boolean;

  @OneToMany(() => AppInstance, (appInstance) => appInstance.app)
  appInstances: AppInstance[];
}
