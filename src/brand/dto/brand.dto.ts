import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Length, IsMongoId, IsPositive, IsNumber, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

import { AtLeastOne } from 'src/common/decorator/common.decorator';

export class CreateBrandDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  slogan: string;
}

@AtLeastOne(['name', 'slogan'])
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

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
