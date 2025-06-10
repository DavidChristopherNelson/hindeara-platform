// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { UsersModule } from 'src/hindeara-platform/users/users.module';
import { UserEventsModule } from 'src/hindeara-platform/user-events/user-events.module';
import { AppEventsModule } from 'src/hindeara-platform/app-events/app-events.module';

@Module({
  imports: [UsersModule, UserEventsModule, AppEventsModule],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class CommonModule {}
