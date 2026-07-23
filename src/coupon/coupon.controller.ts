import { Body, Controller, Post } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/coupon.dto';
import { Auth } from '../common/decorator/auth.decorator';
import { User } from '../common/decorator/user.decorator';
import { HydratedUserDocument } from '../DB/models/user.model';
import { RoleEnum } from '../common/enum/user.enum';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Auth({ access_roles: [RoleEnum.admin] })
  @Post()
  createCoupon(
    @Body() body: CreateCouponDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.couponService.createCoupon(body, user);
  }
}
