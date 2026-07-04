import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

export function AtLeastOne(requiredFields: string[], validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      target: constructor,
      propertyName: '', // Class decorators don't have a propertyName
      options: validationOptions,
      constraints: requiredFields,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if at least one of the required fields exists on the object
          return requiredFields.some((field) => (args.object as any)[field] !== undefined);
        },
        defaultMessage(args: ValidationArguments) {
          return `At least one of the required fields (${requiredFields.join(', ')}) is missing`;
        },
      },
    });
  };
}
