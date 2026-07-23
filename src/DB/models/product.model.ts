import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import { Types, HydratedDocument, UpdateQuery } from 'mongoose';
import { User } from './user.model';
import { Category } from './category.model';
import { Brand } from './brand.model';
import { SubCategory } from './sub-category.model';
import slugify from 'slugify';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Product {
  @Prop({
    type: String,
    required: true,
    minlength: 3,
    trim: true,
    unique: true,
  })
  name: string;

  @Prop({
    type: String,
    default: function (this: Product) {
      return slugify(this.name, { replacement: '-', trim: true, lower: true });
    },
  })
  slug: string;

  @Prop({ type: String, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: Brand.name, required: true })
  brandId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: SubCategory.name })
  subCategoryId: Types.ObjectId;

  @Prop({ type: String, required: true })
  mainImage: string;

  @Prop({ type: [String] })
  subImages: string[];

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, required: true })
  stock: number;

  @Prop({ type: Number, default: 0 })
  rateNum: number;

  @Prop({ type: Number, default: 0 })
  rateAvg: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  deletedBy: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const updated = this.getUpdate() as UpdateQuery<Product>;
  if (updated?.name) {
    updated.slug = slugify(updated.name as string, {
      replacement: '-',
      trim: true,
      lower: true,
    });
  }
});

export type HydratedProductDocument = HydratedDocument<Product>;

export const productModel = MongooseModule.forFeature([
  {
    name: Product.name,
    schema: ProductSchema,
  },
]);
