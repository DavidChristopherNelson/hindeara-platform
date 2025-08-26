import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeDataItemDto {
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
  phoneNumber!: string;

  @ApiProperty()
  userEventCreatedAt!: Date;
}

export class AnalyzeDataResponseDto {
  @ApiProperty({ type: [AnalyzeDataItemDto] })
  items!: AnalyzeDataItemDto[];
}
