import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePhonemeDto {
  @IsNotEmpty()
  @IsString()
  example_noun: string;

  @IsNotEmpty()
  @IsString()
  example_image: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): boolean => (value === undefined ? true : value), {
    toClassOnly: true,
  })
  is_active?: boolean = true;
}
