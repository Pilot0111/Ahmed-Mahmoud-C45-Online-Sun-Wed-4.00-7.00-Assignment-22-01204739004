import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidationOptions,
  registerDecorator,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { GenderEnum } from 'src/common/enum/user.enum';

// ─── Custom IsMatch Validator ─────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-unsafe-call */
@ValidatorConstraint({ name: 'matchKey', async: false })
export class matchKey implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} and ${args.constraints?.[0]} do not match`;
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
      validator: matchKey,
    });
  };
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ValidateIf((data: CreateUserDto) => Boolean(data.password))
  @IsMatch(['password'])
  cPassword: string;

  @IsNumber()
  @Min(18)
  @Max(60)
  age: number;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
