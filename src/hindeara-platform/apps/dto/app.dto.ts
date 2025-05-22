import { Expose, Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import type { App } from '../entities/app.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AppDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  /** http_path  → httpPath */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): string => (obj as App).http_path, // 👈 cast
    { toClassOnly: true },
  )
  httpPath!: string;

  /** is_active  → isActive */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): boolean => (obj as App).is_active, // 👈 cast
    { toClassOnly: true },
  )
  isActive!: boolean;

  /** AppEvent[] → number[] */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): number[] => {
      const events = (obj as App).appEvents;
      return Array.isArray(events) ? events.map((e) => e.id) : [];
    },
    { toClassOnly: true },
  )
  appEventIds!: number[];
}
