import { Module } from '@nestjs/common';
import { PhonemesService } from './phonemes.service';
import { PhonemesController } from './phonemes.controller';
import { Phoneme } from './entities/phoneme.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Phoneme])],
  controllers: [PhonemesController],
  providers: [PhonemesService],
  exports: [PhonemesService],
})
export class PhonemesModule {}
