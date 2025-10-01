// src/hindeara-platform/platform/dto/analyze-data-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeDataItemDto {
  @ApiProperty()
  appTranscript!: string;

  @ApiProperty({ description: 'Base64-encoded audio from the user event' })
  audioBase64!: string;

  @ApiProperty({ nullable: true })
  transcript!: string | null;

  @ApiProperty({ nullable: true })
  answerStatus!: boolean | null;

  @ApiProperty({ nullable: true })
  correctAnswer!: string | null;

  @ApiProperty({ nullable: true })
  studentAnswer!: string | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty()
  userEventCreatedAt!: Date;

  @ApiProperty()
  latency!: number;
}

export class AnalyzeDataResponseDto {
  @ApiProperty({ type: [AnalyzeDataItemDto] })
  items!: AnalyzeDataItemDto[];

  @ApiProperty()
  missedDays!: number;

  @ApiProperty({ type: Array<{ phonemeId: number; letter: string; value: string | null }> })
  userScore: Array<{ letter: string; value: string | null }>;

  @ApiProperty({ type: Array<{ phonemeId: number; letter: string; value: string | null; createdAt: Date }> })
  scoreHistory: Array<{ phonemeId: number; letter: string; value: string | null; createdAt: Date }>;
}
