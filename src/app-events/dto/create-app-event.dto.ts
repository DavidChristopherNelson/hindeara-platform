import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppEventDto {
  @IsNotEmpty()
  @IsString()
  recording: string;

  @IsNotEmpty()
  @IsString()
  uiData: string;

  @IsNotEmpty()
  @IsBoolean()
  isComplete: boolean;
}
