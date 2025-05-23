import { z } from 'zod';

export const PlainStringResponseSchema = z.object({
  data: z.object({
    choices: z.tuple([
      z.object({
        message: z.object({
          role: z.literal('assistant'),
          content: z.string(),
        }),
      }),
    ]),
  }),
});

export const ToolCallBooleanResponseSchema = z.object({
  data: z.object({
    choices: z.tuple([
      z.object({
        message: z.object({
          tool_call: z.object({
            function: z.object({
              arguments: z.string().refine(isJsonWithBooleanAnswer, {
                message: 'arguments must be valid JSON with a boolean "answer"',
              }),
            }),
          }),
        }),
      }),
    ]),
  }),
});

function isJsonWithBooleanAnswer(str: string): boolean {
  try {
    const parsed = JSON.parse(str) as unknown;
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'answer' in parsed &&
      typeof (parsed as { answer?: unknown }).answer === 'boolean'
    );
  } catch {
    return false;
  }
}
