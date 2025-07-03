// src/common/decorators/log-method.decorator.ts
import { Logger } from '@nestjs/common';

type AnyFunc = (...args: unknown[]) => unknown;

/** Per-value limit for very large strings (e.g. base-64 blobs). */
const VALUE_LIMIT = 1000;
/** After JSON-stringify, stop printing at this length as an absolute cap. */
const LINE_LIMIT = 3000;

/** Replacer that truncates *string* values but leaves keys intact. */
function truncatingReplacer(_: string, value: unknown): unknown {
  if (typeof value === 'string' && value.length > VALUE_LIMIT) {
    return value.slice(0, VALUE_LIMIT) + '…';
  }
  return value;
}

/** Utility used twice below. */
function safeStringify(data: unknown): string {
  try {
    const json = JSON.stringify(data, truncatingReplacer);
    return json.length > LINE_LIMIT ? json.slice(0, LINE_LIMIT) + '…' : json;
  } catch {
    return '«non-serialisable»';
  }
}

/**
 * @LogMethod()
 *
 * Logs class name, method name, arguments, execution time, and—if JSON-serialisable—the result.
 * String values are truncated to 10 000 chars; whole log lines are capped at 100 000 chars.
 */
export function LogMethod(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): void => {
    // Preserve original
    const original = descriptor.value as AnyFunc;

    descriptor.value = function (...args: unknown[]) {
      /* ---------- pre-call ---------- */
      const className =
        (target as { constructor?: { name?: string } }).constructor?.name ??
        'UnknownClass';
      const methodName = String(propertyKey);
      const logger = new Logger(className);

      logger.log(`→ ${methodName} called with: ${safeStringify(args)}`);

      const started = Date.now();

      /* ---------- invoke ---------- */
      const raw = original.apply(this, args) as unknown;

      /* ---------- post-call helper (shared by sync + async) ---------- */
      const finish = (result: unknown): unknown => {
        const duration = Date.now() - started;
        logger.log(
          `← ${methodName} finished in ${duration} ms with: ${safeStringify(result)}`,
        );
        return result;
      };

      /* Promise-aware */
      return raw instanceof Promise
        ? (raw.then(finish) as unknown)
        : finish(raw);
    };
  };
}
