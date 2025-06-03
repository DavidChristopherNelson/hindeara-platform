import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePhonemeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(
    ({ value }): string => {
      if (typeof value === 'string') return value.toUpperCase();
      throw new Error('letter must be a string');
    },
    { toClassOnly: true },
  )
  letter: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  example_noun: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  example_image: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): boolean => (value === undefined ? true : value), {
    toClassOnly: true,
  })
  is_active?: boolean = true;
}
