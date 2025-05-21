// src/common/decorators/log-method.decorator.ts
import { Logger } from '@nestjs/common';

type AnyFunc = (...args: unknown[]) => unknown;

/**
 * @LogMethod()
 *
 * Logs class name, method name, arguments, execution time, and—if JSON-serialisable—the result.
 * Contains **zero occurrences of `any`** and is therefore eslint-clean under the
 * default NestJS ESLint configuration.
 */
export function LogMethod(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): void => {
    // Original method cast once, in a single place, to a known-safe type.
    const original = descriptor.value as AnyFunc;

    descriptor.value = function (...args: unknown[]) {
      /* ---------- pre-call ---------- */
      const className =
        (target as { constructor?: { name?: string } }).constructor?.name ??
        'UnknownClass';
      const methodName = String(propertyKey);
      const logger = new Logger(className);

      logger.log(`→ ${methodName} called with: ${JSON.stringify(args)}`);

      const started = Date.now();

      /* ---------- invoke ---------- */
      const raw = original.apply(this, args) as unknown;

      /* ---------- post-call helper (shared by sync + async paths) ---------- */
      const finish = (result: unknown): unknown => {
        const duration = Date.now() - started;

        let printable = '«non-serialisable»';
        try {
          printable = JSON.stringify(result);
        } catch {
          /* ignore – some objects cannot be stringified */
        }

        logger.log(
          `← ${methodName} finished in ${duration} ms with: ${printable}`,
        );
        return result;
      };

      /* If the user method returns a Promise, wait for it. */
      if (raw instanceof Promise) {
        return raw.then(finish) as unknown;
      }

      /* Synchronous return */
      return finish(raw);
    };
  };
}
