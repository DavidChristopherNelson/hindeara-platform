import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessUserInputResponseDto {
  @IsNotEmpty()
  @IsString()
  recording: string;
}
