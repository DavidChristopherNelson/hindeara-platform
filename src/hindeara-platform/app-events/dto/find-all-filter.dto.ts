import {
  IsOptional,
  IsInt,
  IsPositive,
  IsString,
  MinLength,
  IsDate,
} from 'class-validator';

/**
 * Incoming “filter” DTO for querying `AppEvent`s.
 * - All fields are optional so callers can mix-and-match predicates.
 */
export class FindAllFilterDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  /** ISO-8601 date string parsed to `Date` in the service layer. */
  @IsOptional()
  @IsDate()
  since?: Date;

  @IsOptional()
  @IsInt()
  @IsPositive()
  appId?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  locale?: string;
}

export type findAllFilter = InstanceType<typeof FindAllFilterDto>;
