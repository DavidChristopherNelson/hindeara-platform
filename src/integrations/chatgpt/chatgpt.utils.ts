// src/integrations/chatgpt/chatgpt.utils.ts
import type { ChatCompletion } from 'openai/resources/chat/completions';
import {
  PlainStringResponseSchema,
  ToolCallBooleanResponseSchema,
} from './chatgpt.schema';

/*───────────────────────────────*
 *  Generic helpers
 *───────────────────────────────*/
export function isTimeout(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as { name?: string; message?: string };
    return (
      (!!e.name && e.name.toLowerCase().includes('timeout')) ||
      (!!e.message && e.message.toLowerCase().includes('timeout')) ||
      (!!e.name && e.name.toLowerCase().includes('abort'))
    );
  }
  return false;
}

export function localeFallback(locale: string): string {
  return locale === 'hi'
    ? 'कुछ गलत हो गया है। दोबारा कोशिश करें।'
    : 'Something went wrong. Please try again.';
}

/*───────────────────────────────*
 *  Response parsers
 *───────────────────────────────*/
export function parseBooleanResponse(data: ChatCompletion): boolean {
  if (!ToolCallBooleanResponseSchema.safeParse(data).success) {
    throw new Error(`Schema mismatch - data: ${JSON.stringify(data)}`);
  }

  const rawArgs = data.choices[0].message.tool_calls?.[0]?.function?.arguments;
  if (!rawArgs) throw new Error('Missing tool arguments');

  return (JSON.parse(rawArgs) as { response: boolean }).response;
}

export function parseStringResponse(data: ChatCompletion): string {
  if (!PlainStringResponseSchema.safeParse({ data }).success) {
    throw new Error('Unexpected response structure');
  }
  const content = data.choices[0].message.content;
  if (content === null) throw new Error('OpenAI returned null content');
  return content;
}
