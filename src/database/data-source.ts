// src/database/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { UserEvent } from 'src/hindeara-platform/user-events/entities/user-event.entity';
import { App } from 'src/hindeara-platform/apps/entities/app.entity';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { Phoneme } from 'src/apps/alfa-app/phonemes/entities/phoneme.entity';
import { MiniLesson } from 'src/apps/alfa-app/mini-lessons/entities/mini-lesson.entity';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USER,
  DB_PASS,
  DB_NAME,
} = process.env;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  entities: [
    User,
    UserEvent,
    App,
    AppEvent,
    Phoneme,
    MiniLesson,
    __dirname + '/../**/*.entity.{ts,js}',
  ],
  migrations: ['dist/src/database/migrations/*.{ts,js}'],
  synchronize: false, // migrations-only schema
  logging: ['query', 'error'],
};

export default new DataSource(dataSourceOptions);
