import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'CouponValidator', async: false })
export class CouponValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    const fromDate = new Date(obj.fromDate);
    const toDate = new Date(obj.toDate);
    const now = new Date();

    return fromDate >= now && fromDate < toDate;
  }

  defaultMessage(args: ValidationArguments) {
    return 'fromDate must be greater than or equal to now and less than toDate';
  }
}

export function IsCouponValid(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCouponValid',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: CouponValidator,
    });
  };
}
