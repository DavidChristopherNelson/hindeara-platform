import { Expose, Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import type { App } from '../entities/app.entity';

export class AppDto {
  @Expose()
  id!: number;

  /** http_path  → httpPath */
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): string => (obj as App).http_path, // 👈 cast
    { toClassOnly: true },
  )
  httpPath!: string;

  /** is_active  → isActive */
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): boolean => (obj as App).is_active, // 👈 cast
    { toClassOnly: true },
  )
  isActive!: boolean;

  /** AppEvent[] → number[] */
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
