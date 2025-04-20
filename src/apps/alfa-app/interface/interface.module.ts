import { Module } from '@nestjs/common';
import { AlfaAppInterfaceService } from './interface.service';
import { InterfaceController } from './interface.controller';
import { MiniLessonsModule } from '../mini-lessons/mini-lessons.module';
import { AppEventsModule } from 'src/hindeara-platform/app-events/app-events.module';

@Module({
  imports: [MiniLessonsModule, AppEventsModule],
  controllers: [InterfaceController],
  providers: [AlfaAppInterfaceService],
  exports: [AlfaAppInterfaceService],
})
export class AlfaAppInterfaceModule {}
