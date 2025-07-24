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
}
