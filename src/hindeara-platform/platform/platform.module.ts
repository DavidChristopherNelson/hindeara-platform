import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { AppsModule } from '../apps/apps.module';
import { UserEventsModule } from '../user-events/user-events.module';
import { AppEventsModule } from '../app-events/app-events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlfaAppInterfaceModule } from 'src/apps/alfa-app/interface/interface.module';
import { UsersModule } from '../users/users.module';
import { ChatGPTModule } from 'src/integrations/chatgpt/chatgpt.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      // host: process.env.DB_HOST ?? 'localhost',
      // port: +(process.env.DB_PORT ?? 5432),
      // username: process.env.DB_USER ?? 'test',
      // password: process.env.DB_PASS ?? 'test',
      // database: process.env.DB_NAME ?? 'hindeara',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AppsModule,
    UserEventsModule,
    AppEventsModule,
    AlfaAppInterfaceModule,
    UsersModule,
    ChatGPTModule,
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
