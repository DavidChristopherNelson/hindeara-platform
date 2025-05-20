import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class CreateAppDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  http_path: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  is_active?: boolean;
}
