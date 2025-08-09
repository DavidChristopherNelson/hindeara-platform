import { Module } from '@nestjs/common';
import { ReverieService } from './reverie.service';

@Module({
  providers: [ReverieService],
  exports: [ReverieService],
})
export class ReverieModule {}
