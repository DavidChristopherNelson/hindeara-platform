/* eslint-disable @typescript-eslint/no-unsafe-call */

import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserEventDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  recording: string;
}
