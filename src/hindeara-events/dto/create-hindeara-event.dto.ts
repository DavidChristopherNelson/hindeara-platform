import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateHindearaEventDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  recording: string;
}
