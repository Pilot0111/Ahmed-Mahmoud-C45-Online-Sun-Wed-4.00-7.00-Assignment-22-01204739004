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

BrandSchema.pre(['findOneAndUpdate', 'updateOne'], async function () {
  const updated = this.getUpdate() as UpdateQuery<Brand>;
  if (updated?.name) {
    updated.slug = slugify(updated.name as string, { replacement: '-', trim: true, lower: true });
  }

  if (updated?.deletedAt) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      const mongoose = require('mongoose');
      const Product = mongoose.models.Product || mongoose.model('Product');
      if (Product) {
        await Product.updateMany(
          { brandId: docToUpdate._id, deletedAt: { $exists: false } },
          { deletedAt: updated.deletedAt, deletedBy: updated.deletedBy }
        );
      }
    }
  }
  // End hook
});

export type HydratedBrandDocument = HydratedDocument<Brand>;

export const brandModel = MongooseModule.forFeature([
  {
    name: Brand.name,
    schema: BrandSchema,
  },
]);
