import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';

export class ProcessUserInputResponseDto {
  @IsNotEmpty()
  @IsString()
  recording: string;

  @IsString()
  uiData: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  appId: number;

  static fromAppEvent(appEvent: AppEvent): ProcessUserInputResponseDto {
    console.log('-----------------------------------------------------------');
    console.log(appEvent);
    console.log('-----------------------------------------------------------');
    return {
      recording: appEvent.recording,
      uiData: appEvent.uiData,
      userId: appEvent.user.id,
      appId: appEvent.app.id,
    };
  }
}
