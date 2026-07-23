import { IsMongoId, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Types } from 'mongoose';

export class AddToCartDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class RemoveFromCartDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: Types.ObjectId;
}

export class UpdateProductQuantityDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

