import { ConflictException, Injectable } from '@nestjs/common';
import { CouponRepository } from '../DB/repositories/coupon.repository';
import { UserRepository } from '../DB/repositories/user.repository';
import { CreateCouponDto } from './dto/coupon.dto';
import { HydratedUserDocument } from '../DB/models/user.model';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepo: CouponRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async createCoupon(body: CreateCouponDto, user: HydratedUserDocument) {
    const { amount, code, fromDate, toDate } = body;

    const existingCoupon = await this.couponRepo.findOne({
      filter: { code: code.toLowerCase() },
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon already exists');
    }

    const coupon = await this.couponRepo.create({
      createdBy: user._id,
      code,
      amount,
      fromDate,
      toDate,
    });

    return coupon;
  }
}
