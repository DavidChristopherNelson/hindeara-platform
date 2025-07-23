// src/apps/alfa-app/interface/dto/ui-data.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UiDataDto {
  @ApiProperty({ example: 'cat' })
  word: string;

  @ApiProperty({ example: 'a' })
  letter: string;

  @ApiProperty({ example: 'apple.png' })
  picture: string;

  @ApiProperty({ example: 'letter' })
  state: string;

  @ApiProperty({ example: 'It is a cat!' })
  transcript: string | null;

  @ApiProperty({ example: ['त', 'ू'] })
  wrongCharacters: string[];
}
