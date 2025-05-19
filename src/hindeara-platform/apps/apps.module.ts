import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';
import { App } from './entities/app.entity';

@Module({
  imports: [TypeOrmModule.forFeature([App]), HttpModule],
  controllers: [AppsController],
  providers: [AppsService],
  exports: [AppsService],
})
export class AppsModule {}
