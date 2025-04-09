import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { AppStatus } from '../entities/app-instance.entity';

export class CreateAppInstanceDto {
  @IsEnum(AppStatus, {
    message: `Status must be one of the following values: ${Object.values(AppStatus).join(', ')}`,
  })
  status: AppStatus;

  // The ID of the associated HindearaEvent entity.
  @IsNotEmpty()
  @IsNumber()
  hindearaEventId: number;

  // The ID of the associated App entity.
  @IsNotEmpty()
  @IsNumber()
  appId: number;
}
