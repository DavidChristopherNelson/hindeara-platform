import { Module } from '@nestjs/common';
import { AppInstancesService } from './app-instances.service';
import { AppInstancesController } from './app-instances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppInstance } from './entities/app-instance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppInstance])],
  controllers: [AppInstancesController],
  providers: [AppInstancesService],
})
export class AppInstancesModule {}
