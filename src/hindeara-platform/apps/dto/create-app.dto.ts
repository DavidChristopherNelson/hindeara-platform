import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class CreateAppDto {
  @IsNotEmpty()
  @IsString()
  http_path: string;

  @IsNotEmpty()
  @IsBoolean()
  is_active?: boolean;
}
