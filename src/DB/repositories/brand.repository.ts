import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import BaseRepository from './base.repository';
import { Brand } from '../models/brand.model';

@Injectable()
export class BrandRepository extends BaseRepository<Brand> {
  constructor(@InjectModel(Brand.name) protected model: Model<Brand>) {
    super(model);
  }
}
