import { Module } from '@nestjs/common';
import { AppInstancesService } from './app-instances.service';
import { AppInstancesController } from './app-instances.controller';

@Module({
  controllers: [AppInstancesController],
  providers: [AppInstancesService],
})
export class AppInstancesModule {}
