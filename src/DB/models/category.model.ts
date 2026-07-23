import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Types, HydratedDocument, UpdateQuery } from 'mongoose';
import { User } from './user.model';
import slugify from 'slugify';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Category {
  @Prop({ type: String, required: true, min: 5, trim: true, unique: true })
  name: string;

  @Prop({
    type: String,
    default: function (this: Category) {
      return slugify(this.name, { replacement: '-', trim: true, lower: true });
    },
  })
  slug: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }] })
  brands: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  deletedBy: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre(['findOneAndUpdate', 'updateOne'], async function () {
  const updated = this.getUpdate() as UpdateQuery<Category>;
  if (updated?.name) {
    updated.slug = slugify(updated.name as string, {
      replacement: '-',
      trim: true,
      lower: true,
    });
  }

  // Soft delete cascading
  if (updated?.deletedAt) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      // Need to require mongoose to get registered models
      const mongoose = require('mongoose');

      const SubCategory =
        mongoose.models.SubCategory || mongoose.model('SubCategory');
      if (SubCategory) {
        await SubCategory.updateMany(
          { categoryId: docToUpdate._id, deletedAt: { $exists: false } },
          { deletedAt: updated.deletedAt, deletedBy: updated.deletedBy },
        );
      }

      const Product = mongoose.models.Product || mongoose.model('Product');
      if (Product) {
        await Product.updateMany(
          { categoryId: docToUpdate._id, deletedAt: { $exists: false } },
          { deletedAt: updated.deletedAt, deletedBy: updated.deletedBy },
        );
      }
    }
  }
  // End hook
});

export type HydratedCategoryDocument = HydratedDocument<Category>;

export const categoryModel = MongooseModule.forFeature([
  {
    name: Category.name,
    schema: CategorySchema,
  },
]);
