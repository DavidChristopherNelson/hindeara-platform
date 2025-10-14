// src/apps/alfa-app/interface/dto/ui-data.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UiDataDto {
  @ApiProperty({ example: 'cat' })
  word: string;

  @ApiProperty({ example: 'a' })
  letter?: string;

  @ApiProperty({ example: 'apple.png' })
  picture?: string;

  @ApiProperty({ example: 'letter' })
  state: string;

  @ApiProperty({ example: 'It is a cat!' })
  transcript: string | null;

  @ApiProperty({ example: ['त', 'ू'] })
  wrongCharacters: string[];

  @ApiProperty({ example: 10 })
  numUniqueWords?: number;

  @ApiProperty({ example: ['त', 'ू'] })
  deployCheck: string;

  @ApiProperty({ type: Array<{ phonemeId: number; letter: string; value: number; status: 'revealCard' | null }> })
  userScore: Array<{ letter: string; value: number; cardReveal: boolean }>;
}
