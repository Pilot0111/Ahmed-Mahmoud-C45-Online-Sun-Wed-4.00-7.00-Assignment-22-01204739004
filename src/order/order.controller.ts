import { Body, Controller, Post, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { Auth } from '../common/decorator/auth.decorator';
import { User } from '../common/decorator/user.decorator';
import { HydratedUserDocument } from '../DB/models/user.model';
import { RoleEnum } from '../common/enum/user.enum';
import { Types } from 'mongoose';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Auth({ access_roles: [RoleEnum.admin] })
  @Post()
  createOrder(
    @Body() body: CreateOrderDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.orderService.createOrder(body, user);
  }

  @Post('stripe/:id')
  @Auth({ access_roles: [RoleEnum.admin] })
  paymentWithStripe(
    @Param('id') id: Types.ObjectId,
    @User() user: HydratedUserDocument,
  ) {
    return this.orderService.paymentWithStripe(id, user);
  }

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.orderService.webhook(body);
  }

  @Post('refund/:id')
  @Auth({ access_roles: [RoleEnum.admin] })
  refundOrder(
    @Param('id') id: Types.ObjectId,
    @User() user: HydratedUserDocument,
  ) {
    return this.orderService.refundOrder(id, user);
  }
}
