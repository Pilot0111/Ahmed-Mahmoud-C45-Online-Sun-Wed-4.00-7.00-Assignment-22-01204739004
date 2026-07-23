import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { couponModel } from '../DB/models/coupon.model';
import CouponRepository from '../DB/repositories/coupon.repository';

@Module({
  imports: [couponModel],
  controllers: [CouponController],
  providers: [CouponService, CouponRepository],
  exports: [CouponRepository],
})
export class CouponModule {}
