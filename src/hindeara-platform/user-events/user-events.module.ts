import { Module } from '@nestjs/common';
import { UserEventsService } from './user-events.service';
import { UserEventsController } from './user-events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEvent } from './entities/user-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEvent])],
  controllers: [UserEventsController],
  providers: [UserEventsService],
  exports: [UserEventsService],
})
export class UserEventsModule {}
