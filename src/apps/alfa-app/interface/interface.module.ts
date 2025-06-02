import { Module } from '@nestjs/common';
import { AlfaAppInterfaceService } from './interface.service';
import { InterfaceController } from './interface.controller';
import { MiniLessonsModule } from '../mini-lessons/mini-lessons.module';
import { AppEventsModule } from 'src/hindeara-platform/app-events/app-events.module';
import { UserEventsModule } from 'src/hindeara-platform/user-events/user-events.module';
import { ChatGPTModule } from 'src/integrations/chatgpt/chatgpt.module';
import { PhonemesModule } from '../phonemes/phonemes.module';

@Module({
  imports: [
    MiniLessonsModule,
    AppEventsModule,
    UserEventsModule,
    ChatGPTModule,
    PhonemesModule,
  ],
  controllers: [InterfaceController],
  providers: [AlfaAppInterfaceService],
  exports: [AlfaAppInterfaceService],
})
export class AlfaAppInterfaceModule {}
