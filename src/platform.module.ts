import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { UsersModule } from './users/users.module';
import { AppsModule } from './apps/apps.module';
import { UserEventsModule } from './user-events/user-events.module';
import { AppEventsModule } from './app-events/app-events.module';

@Module({
  imports: [UsersModule, AppsModule, UserEventsModule, AppEventsModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
