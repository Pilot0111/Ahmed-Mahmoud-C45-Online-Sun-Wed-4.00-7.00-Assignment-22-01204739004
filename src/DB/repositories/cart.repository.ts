import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, HCartDocument } from '../models/cart.model';
import BaseRepository from './base.repository';

@Injectable()
export class CartRepository extends BaseRepository<HCartDocument> {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<HCartDocument>,
  ) {
    super(cartModel);
  }
}
