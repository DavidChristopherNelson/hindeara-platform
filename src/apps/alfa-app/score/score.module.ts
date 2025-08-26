import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPhonemeScore } from './score.entity';
import { UserPhonemeScoreService } from './score.service';
import { Phoneme } from 'src/apps/alfa-app/phonemes/entities/phoneme.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { UserPhonemeScoreController } from './score.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserPhonemeScore, Phoneme, User])],
  controllers: [UserPhonemeScoreController],
  providers: [UserPhonemeScoreService],
  exports: [UserPhonemeScoreService],
})
export class UserPhonemeScoreModule {}
