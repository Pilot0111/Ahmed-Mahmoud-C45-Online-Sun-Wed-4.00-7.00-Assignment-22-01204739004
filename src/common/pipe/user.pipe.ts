import { ZodType } from 'zod';
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  HttpException,
} from '@nestjs/common';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}
  transform(value: Record<string, unknown>, metadata: ArgumentMetadata) {
    console.log({ value, metadata });
    const { success, error } = this.schema.safeParse(value);
    if (!success) {
      throw new HttpException(
        {
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({
            path: issue.path[0],
            message: issue.message,
          })),
        },
        400,
      );
    }
    return value;
  }
}
