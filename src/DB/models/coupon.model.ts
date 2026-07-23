import { HydratedDocument, Types } from 'mongoose';
import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { User } from './user.model';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Coupon {
  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  usedBy: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 100, required: true })
  amount: number;

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  code: string;

  @Prop({ type: Date, required: true })
  fromDate: Date;

  @Prop({ type: Date, required: true })
  toDate: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
export type HydratedCouponDocument = HydratedDocument<Coupon>;

export const couponModel = MongooseModule.forFeature([
  {
    name: Coupon.name,
    schema: CouponSchema,
  },
]);
