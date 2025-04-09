import { Module } from '@nestjs/common';
import { AppInstancesService } from './app-instances.service';
import { AppInstancesController } from './app-instances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppInstance } from './entities/app-instance.entity';
import { HindearaEventsModule } from 'src/hindeara-events/hindeara-events.module';
import { AppsModule } from 'src/apps/apps.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppInstance]),
    HindearaEventsModule,
    AppsModule,
  ],
  controllers: [AppInstancesController],
  providers: [AppInstancesService],
})
export class AppInstancesModule {}
