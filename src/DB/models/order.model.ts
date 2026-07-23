import { HydratedDocument, Types } from 'mongoose';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.model';
import { Cart } from './cart.model';
import { Coupon } from './coupon.model';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enum/order.enum';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Order {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Cart.name, required: true })
  cart: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Coupon.name })
  coupon: Types.ObjectId;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Prop({ type: Date, default: () => Date.now() + 3 * 24 * 60 * 60 * 1000 })
  arrivedAt: Date;

  @Prop({ type: String })
  paymentIntent: string;

  @Prop({
    type: {
      paidAt: Date,
      deliveredAt: Date,
      deliveredBy: { type: Types.ObjectId, ref: User.name },
      refundAt: Date,
      refundBy: { type: Types.ObjectId, ref: User.name },
    },
  })
  orderChanges: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export type HydratedOrderDocument = HydratedDocument<Order>;

export const orderModel = MongooseModule.forFeature([
  {
    name: Order.name,
    schema: OrderSchema,
  },
]);
