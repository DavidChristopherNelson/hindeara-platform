import { PartialType } from '@nestjs/mapped-types';
import { CreateMiniLessonDto } from './create-mini-lesson.dto';

export class UpdateMiniLessonDto extends PartialType(CreateMiniLessonDto) {}
