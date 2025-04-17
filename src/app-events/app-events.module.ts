import { Module } from '@nestjs/common';
import { AppEventsService } from './app-events.service';
import { AppEventsController } from './app-events.controller';
import { UsersModule } from 'src/users/users.module';
import { AppEvent } from './entities/app-event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AppEvent]), UsersModule],
  controllers: [AppEventsController],
  providers: [AppEventsService],
  exports: [AppEventsService],
})
export class AppEventsModule {}
