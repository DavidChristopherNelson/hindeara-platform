import { Module } from '@nestjs/common';
import { HindearaEventsService } from './hindeara-events.service';
import { HindearaEventsController } from './hindeara-events.controller';
import { HindearaEvent } from './entities/hindeara-event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([HindearaEvent])],
  controllers: [HindearaEventsController],
  providers: [HindearaEventsService],
})
export class HindearaEventsModule {}
