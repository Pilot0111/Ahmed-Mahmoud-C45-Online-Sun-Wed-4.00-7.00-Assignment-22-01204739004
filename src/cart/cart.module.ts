import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from 'src/DB/repositories/cart.repository';
import { cartModel } from 'src/DB/models/cart.model';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [cartModel, ProductModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartRepository],
})
export class CartModule {}
