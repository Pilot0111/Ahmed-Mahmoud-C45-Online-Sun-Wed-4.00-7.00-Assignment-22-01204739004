import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'customKey', async: false })
export class CustomKey implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue; // Standard IsMatch logic (e.g., password === confirmPassword)
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must match ${args.constraints[0]}`;
  }
}

export function IsMatch(
  constraints: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: CustomKey,
    });
  };
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
