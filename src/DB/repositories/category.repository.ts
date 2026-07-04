import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import BaseRepository from './base.repository';
import { Category, HydratedCategoryDocument } from '../models/category.model';

@Injectable()
export class CategoryRepository extends BaseRepository<Category> {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<HydratedCategoryDocument>,
  ) {
    super(categoryModel);
  }
}
