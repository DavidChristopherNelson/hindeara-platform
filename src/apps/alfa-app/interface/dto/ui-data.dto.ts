import { ApiProperty } from '@nestjs/swagger';

export class UiDataDto {
  @ApiProperty({ example: 'cat' })
  word: string;

  @ApiProperty({ example: 'a' })
  letter: string;

  @ApiProperty({ example: 'apple.png' })
  picture: string;

  @ApiProperty({ example: 'apple.png' })
  state: string;
}
