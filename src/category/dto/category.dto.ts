import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Length,
  IsMongoId,
  IsPositive,
  IsNumber,
  IsOptional,
  Validate,
} from 'class-validator';
import { Types } from 'mongoose';
import { AtLeastOne } from 'src/common/decorator/common.decorator';
import { ValidateIds } from 'src/common/decorator/category.decorator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  name: string;

  @Validate(ValidateIds)
  brands: Types.ObjectId[];
}

@AtLeastOne(['name', 'brands'])
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class IdDto {
  @IsNotEmpty()
  @IsMongoId()
  id: Types.ObjectId;
}

export class QueryDto {
  @IsOptional()
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
