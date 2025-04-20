import { Module } from '@nestjs/common';
import { PhonemesService } from './phonemes.service';
import { PhonemesController } from './phonemes.controller';

@Module({
  controllers: [PhonemesController],
  providers: [PhonemesService],
})
export class PhonemesModule {}
