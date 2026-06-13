// src/common/interceptors/serialize.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Prisma Decimal → number
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  // Date → ISO string
  if (value instanceof Date) {
    return value.toISOString();
  }

  // BigInt → string
  if (typeof value === 'bigint') {
    return value.toString();
  }

  // Array → recurse
  if (Array.isArray(value)) {
    return value.map(item => serializeValue(item));
  }

  // Object → recurse
  if (typeof value === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = serializeValue(val);
    }
    return serialized;
  }

  // Primitive → pass through
  return value;
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(data => serializeValue(data)));
  }
}