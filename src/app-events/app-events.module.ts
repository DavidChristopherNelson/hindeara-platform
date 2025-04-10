import { Module } from '@nestjs/common';
import { AppEventsService } from './app-events.service';
import { AppEventsController } from './app-events.controller';

@Module({
  controllers: [AppEventsController],
  providers: [AppEventsService],
})
export class AppEventsModule {}
