// src/hindeara-platform/user-events/dto/user-event.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserEventDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  recording!: string;

  @ApiProperty()
  @Expose()
  locale!: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  @Type(() => Number)
  userId!: number;

  @ApiProperty({ required: false })
  @Expose()
  transcription?: string;

  @ApiProperty({ required: false, description: 'Time when the previous request was received by the frontend' })
  @Expose()
  previousRequestReceivedByFrontendAt?: Date;

  @ApiProperty({ required: false, description: 'Time when the request was sent from the frontend' })
  @Expose()
  requestSentFromFrontendAt?: Date;

  @ApiProperty({ required: false, description: 'Time when the backend received the request' })
  @Expose()
  requestReceivedByBackendAt?: Date;
}
