import { Expose, Type } from 'class-transformer';

export class UserEventDto {
  @Expose()
  id!: number;

  @Expose()
  recording!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  @Type(() => Number)
  userId!: number;
}
