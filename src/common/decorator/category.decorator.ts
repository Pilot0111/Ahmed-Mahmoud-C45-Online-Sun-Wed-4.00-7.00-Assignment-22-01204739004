import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'ValidateIds', async: false })
export class ValidateIds implements ValidatorConstraintInterface {
  validate(value: string[], args: ValidationArguments) {
    if (!Array.isArray(value)) return false;
    // Note: The instructor's code had `!= value.length`, but for class-validator
    // validate() should return `true` if the validation succeeds.
    // So if all IDs are valid, the filtered length should EQUAL the original length.
    return (
      value.filter((id) => Types.ObjectId.isValid(id)).length === value.length
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `some of id is inValid`; // Matches instructor's message
  }
}

// This wrapper is needed to actually use it as a decorator like @IsValidIds()
export function IsValidIds(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateIds,
    });
  };
}
