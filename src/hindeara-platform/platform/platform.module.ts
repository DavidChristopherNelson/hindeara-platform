// src/hindeara-platform/platform/platform.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { AppsModule } from '../apps/apps.module';
import { UserEventsModule } from '../user-events/user-events.module';
import { AppEventsModule } from '../app-events/app-events.module';
import { dataSourceOptions } from 'src/database/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlfaAppInterfaceModule } from 'src/apps/alfa-app/interface/interface.module';
import { UsersModule } from '../users/users.module';
import { ChatGPTModule } from 'src/integrations/chatgpt/chatgpt.module';
import { CommonModule } from 'src/common/common.module';
import { StateModule } from 'src/apps/alfa-app/state/state.module';
import { SpeechmaticsModule } from 'src/integrations/speechmatics/speechmatics.module';
import { GoogleModule } from 'src/integrations/google/google.module';
import { DeepgramModule } from 'src/integrations/deepgram/deepgram.module';
import { SarvamModule } from 'src/integrations/sarvam/sarvam.module';
import { AssemblyModule } from 'src/integrations/assembly/assembly.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...dataSourceOptions }),
    }),
    AppsModule,
    UserEventsModule,
    AppEventsModule,
    AlfaAppInterfaceModule,
    UsersModule,
    ChatGPTModule,
    SpeechmaticsModule,
    GoogleModule,
    DeepgramModule,
    SarvamModule,
    AssemblyModule,
    CommonModule,
    StateModule,
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
