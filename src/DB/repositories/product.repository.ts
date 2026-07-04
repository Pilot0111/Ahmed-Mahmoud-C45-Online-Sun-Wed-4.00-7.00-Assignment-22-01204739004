import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, HydratedProductDocument } from '../models/product.model';
import BaseRepository from './base.repository';

@Injectable()
export class ProductRepository extends BaseRepository<HydratedProductDocument> {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<HydratedProductDocument>,
  ) {
    super(productModel);
  }
}
