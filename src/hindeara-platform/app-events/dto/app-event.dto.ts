import { Expose, Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';

/**
 * Read‑model for an AppEvent entity.
 * - Flattens the `user` and `app` relations down to their IDs
 * - Uses `class-transformer` so only `@Expose`d fields are serialized
 */
export class AppEventDto {
  @Expose()
  id!: number;

  @Expose()
  recording!: string;

  @Expose()
  uiData!: string;

  @Expose()
  is_complete!: boolean;

  @Expose()
  createdAt!: Date;

  /** `user.id` extracted from the relation object */
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): number | null => {
      const user = (obj as { user?: { id?: number } }).user;
      return typeof user?.id === 'number' ? user.id : null;
    },
    { toClassOnly: true },
  )
  userId!: number | null;

  /** `app.id` extracted from the relation object */
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): number | null => {
      const app = (obj as { app?: { id?: number } }).app;
      return typeof app?.id === 'number' ? app.id : null;
    },
    { toClassOnly: true },
  )
  appId!: number | null;
}
