import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model';
import { Product } from './product.model';

export type HCartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartProduct {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  finalPrice: number;
}

export const CartProductSchema = SchemaFactory.createForClass(CartProduct);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Cart {
  @Prop({ type: [CartProductSchema] })
  products: CartProduct[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0 })
  subTotal: number;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  deletedBy: Types.ObjectId;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.pre('save', function (next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.products && this.products.length > 0) {
    this.subTotal = this.products.reduce(
      (total, product) => total + product.quantity * product.finalPrice,
      0,
    );
  } else {
    this.subTotal = 0;
  }
  next();
});

export const cartModel = MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]);
