// src/hindeara-platform/platform/platform.module.ts
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
import { CommonModule } from 'src/common/common.module';
import { StateModule } from 'src/apps/alfa-app/state/state.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AppsModule,
    UserEventsModule,
    AppEventsModule,
    AlfaAppInterfaceModule,
    UsersModule,
    ChatGPTModule,
    CommonModule,
    StateModule,
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
