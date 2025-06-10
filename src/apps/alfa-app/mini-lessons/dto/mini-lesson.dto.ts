import { ApiProperty } from '@nestjs/swagger';
import { Snapshot } from 'xstate';
import { Phoneme } from '../../phonemes/entities/phoneme.entity';

export class MiniLessonDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 42 })
  appEventId: number;

  @ApiProperty({ example: 7 })
  userId: number;

  @ApiProperty({ example: 'cat' })
  word: string;

  @ApiProperty({ example: 'hi' })
  locale: string;

  @ApiProperty({
    description: 'XState snapshot serialised as JSON',
    type: Object,
  })
  state: Snapshot<unknown>;

  @ApiProperty({ example: '2025-05-22T12:34:56.000Z' })
  createdAt: Date;

  @ApiProperty({ type: () => Phoneme })
  phoneme: Phoneme;
}
