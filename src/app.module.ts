import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { AppInstancesModule } from './app-instances/app-instances.module';
import { RecordingsModule } from './recordings/recordings.module';
import { AppsModule } from './apps/apps.module';

@Module({
  imports: [UsersModule, EventsModule, AppInstancesModule, RecordingsModule, AppsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
