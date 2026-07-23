import { PartialType } from '@nestjs/mapped-types';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCouponValid } from '../../common/decorator/coupon.validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  code: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  amount: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsCouponValid('toDate')
  fromDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  toDate: Date;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
