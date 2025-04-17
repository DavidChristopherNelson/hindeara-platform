import { forwardRef, Module } from '@nestjs/common';
import { UserEventsService } from './user-events.service';
import { UserEventsController } from './user-events.controller';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEvent } from './entities/user-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEvent]),
    forwardRef(() => UsersModule),
  ],
  controllers: [UserEventsController],
  providers: [UserEventsService],
  exports: [UserEventsService],
})
export class UserEventsModule {}
