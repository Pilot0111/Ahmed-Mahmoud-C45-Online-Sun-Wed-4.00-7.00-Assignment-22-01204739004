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
} from 'class-validator';
import { Types } from 'mongoose';
import { AtLeastOne } from 'src/common/decorator/common.decorator';

export class CreateSubCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  name: string;

  @IsNotEmpty()
  @IsMongoId()
  categoryId: Types.ObjectId;
}

@AtLeastOne(['name', 'categoryId'])
export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) {}

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
