import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import { Types, HydratedDocument, UpdateQuery } from 'mongoose';
import { User } from './user.model';
import slugify from 'slugify';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Brand {
  @Prop({
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    unique: true,
  })
  name: string;

  @Prop({
    type: String,
    default: function (this: Brand) {
      return slugify(this.name, { replacement: '-', trim: true, lower: true });
    },
  })
  slug: string;

  @Prop({
    type: String,
    minLength: 5,
    maxLength: 50,
    trim: true,
  })
  slogan: string;

  @Prop({ type: String, required: true })
  logo: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  deletedBy: Types.ObjectId;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const updated = this.getUpdate() as UpdateQuery<Brand>;
  if (updated?.name) {
    updated.slug = slugify(updated.name as string, { replacement: '-', trim: true, lower: true });
  }
});

export type HydratedBrandDocument = HydratedDocument<Brand>;

export const brandModel = MongooseModule.forFeature([
  {
    name: Brand.name,
    schema: BrandSchema,
  },
]);
