// src/hindeara-platform/users/dto/user.dto.ts
import { Expose, Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import type { User } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Read‑model DTO for the User entity.
 *
 * - Keeps the payload lightweight by returning only arrays of related IDs
 * - Uses `@Expose` so that `class-transformer` strips everything not listed here
 */
export class UserDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  /** UserEvent[] → number[] */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): number[] => {
      const events = (obj as User).userEvents;
      return events?.map((e) => e.id) ?? [];
    },
    { toClassOnly: true },
  )
  userEventIds!: number[];

  /** AppEvent[] → number[] */
  @ApiProperty()
  @Expose()
  @Transform(
    ({ obj }: TransformFnParams): number[] => {
      const events = (obj as User).appEvents;
      return events?.map((e) => e.id) ?? [];
    },
    { toClassOnly: true },
  )
  appEventIds!: number[];
}
