import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EvaluateDto } from './dto/evaluate.dto';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import {
  markWord,
  markLetter,
  markImage,
  detectIncorrectEndMatra,
  detectIncorrectMiddleMatra,
} from './evaluate-answer.utils';

@ApiTags('evaluate')
@Controller('evaluate')
export class EvaluateController {
  @Post('word')
  @ApiBody({ type: EvaluateDto })
  @ApiResponse({
    status: 200,
    description: 'Evaluates a word response.',
    type: Boolean,
  })
  @LogMethod()
  evaluateWord(@Body() body: EvaluateDto): boolean {
    const { correctAnswer, studentAnswer } = body;
    return markWord({ correctAnswer, studentAnswer });
  }

  @Post('letter')
  @ApiBody({ type: EvaluateDto })
  @ApiResponse({
    status: 200,
    description: 'Evaluates a letter response.',
    type: Boolean,
  })
  @LogMethod()
  evaluateLetter(@Body() body: EvaluateDto): boolean {
    const { correctAnswer, studentAnswer } = body;
    return markLetter({ correctAnswer, studentAnswer });
  }

  @Post('image')
  @ApiBody({ type: EvaluateDto })
  @ApiResponse({
    status: 200,
    description: 'Evaluates an image response.',
    type: Boolean,
  })
  @LogMethod()
  evaluateImage(@Body() body: EvaluateDto): boolean {
    const { correctAnswer, studentAnswer } = body;
    return markImage({ correctAnswer, studentAnswer });
  }

  @Post('end-matra')
  @ApiBody({ type: EvaluateDto })
  @ApiResponse({ status: 200, type: Boolean })
  @LogMethod()
  detectEndMatra(@Body() body: EvaluateDto): boolean {
    return detectIncorrectEndMatra(body);
  }

  @Post('middle-matra')
  @ApiBody({ type: EvaluateDto })
  @ApiResponse({ status: 200, type: Boolean })
  @LogMethod()
  detectMiddleMatra(@Body() body: EvaluateDto): boolean {
    return detectIncorrectMiddleMatra(body);
  }
}
