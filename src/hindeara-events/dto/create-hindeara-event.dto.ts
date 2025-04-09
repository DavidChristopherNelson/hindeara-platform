import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateHindearaEventDto {
  @IsNotEmpty()
  @isNumber()
  userId: number;

  @IsNotEmpty()
  @isString()
  recording: string;
}
