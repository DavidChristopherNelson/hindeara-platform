import { Module } from '@nestjs/common';
import { UserEventsService } from './user-events.service';
import { UserEventsController } from './user-events.controller';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEvent } from './entities/user-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEvent]), UsersModule],
  controllers: [UserEventsController],
  providers: [UserEventsService],
})
export class UserEventsModule {}
