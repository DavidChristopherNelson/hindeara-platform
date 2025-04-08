import { Module } from '@nestjs/common';
import { HindearaEventsService } from './hindeara-events.service';
import { HindearaEventsController } from './hindeara-events.controller';

@Module({
  controllers: [HindearaEventsController],
  providers: [HindearaEventsService],
})
export class HindearaEventsModule {}
