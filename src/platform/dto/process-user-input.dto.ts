import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessUserInputDto {
  @IsNotEmpty()
  @IsString()
  recording: string;
}
