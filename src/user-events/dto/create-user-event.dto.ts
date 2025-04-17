import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserEventDto {
  @IsNotEmpty()
  @IsString()
  recording: string;
}
