import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';

export class ProcessUserInputResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  recording: string;

  @ApiProperty()
  @IsString()
  uiData: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  appId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isComplete: boolean;

  static fromAppEvent(appEvent: AppEvent): ProcessUserInputResponseDto {
    return {
      recording: appEvent.recording,
      uiData: appEvent.uiData,
      userId: appEvent.user.id,
      appId: appEvent.app.id,
      isComplete: appEvent.isComplete,
    };
  }
}
