import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { orderModel } from '../DB/models/order.model';
import { OrderRepository } from '../DB/repositories/order.repository';
import { CouponModule } from '../coupon/coupon.module';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { StripeService } from '../common/service/stripe.service';

@Module({
  imports: [orderModel, CouponModule, CartModule, ProductModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    StripeService,
  ],
  exports: [OrderRepository],
})
export class OrderModule {}
