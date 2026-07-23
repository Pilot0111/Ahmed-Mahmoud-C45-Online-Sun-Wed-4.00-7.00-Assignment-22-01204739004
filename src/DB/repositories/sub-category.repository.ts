import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SubCategory,
  HydratedSubCategoryDocument,
} from '../models/sub-category.model';
import BaseRepository from './base.repository';

@Injectable()
export class SubCategoryRepository extends BaseRepository<HydratedSubCategoryDocument> {
  constructor(
    @InjectModel(SubCategory.name)
    private readonly subCategoryModel: Model<HydratedSubCategoryDocument>,
  ) {
    super(subCategoryModel);
  }
}
