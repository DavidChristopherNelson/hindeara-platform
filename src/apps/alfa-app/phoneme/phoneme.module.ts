import { Module } from '@nestjs/common';
import { PhonemeService } from './phoneme.service';
import { PhonemeController } from './phoneme.controller';

@Module({
  controllers: [PhonemeController],
  providers: [PhonemeService],
})
export class PhonemeModule {}
