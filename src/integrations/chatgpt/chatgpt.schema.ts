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

function isJsonWithBooleanResponse(str: string): boolean {
  try {
    const parsed = JSON.parse(str) as unknown;
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'response' in parsed &&
      typeof (parsed as { response?: unknown }).response === 'boolean'
    );
  } catch {
    return false;
  }
}

export const ToolCallBooleanResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            message: z
              .object({
                tool_calls: z
                  .array(
                    z
                      .object({
                        function: z
                          .object({
                            arguments: z
                              .string()
                              .refine(isJsonWithBooleanResponse, {
                                message:
                                  'arguments must be JSON with boolean property "response"',
                              }),
                          })
                          .passthrough(),
                      })
                      .passthrough(),
                  )
                  .nonempty(),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .nonempty(),
  })
  .passthrough();
