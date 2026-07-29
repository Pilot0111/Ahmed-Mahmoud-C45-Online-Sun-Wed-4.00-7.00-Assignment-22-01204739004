import { PartialType } from '@nestjs/mapped-types';
import { Type, Transform } from 'class-transformer';
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

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value.split(',').map((id) => id.trim());
    }
    return value;
  })
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
