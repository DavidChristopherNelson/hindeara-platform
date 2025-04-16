/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAppEventDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

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
