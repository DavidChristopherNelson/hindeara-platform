import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AppsModule } from './apps/apps.module';
import { UserEventsModule } from './user-events/user-events.module';
import { AppEventsModule } from './app-events/app-events.module';

@Module({
  imports: [UsersModule, AppsModule, UserEventsModule, AppEventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
