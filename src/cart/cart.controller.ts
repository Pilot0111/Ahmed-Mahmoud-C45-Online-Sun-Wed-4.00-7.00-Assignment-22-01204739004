import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, RemoveFromCartDto, UpdateProductQuantityDto } from './dto/cart.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { RoleEnum } from 'src/common/enum/user.enum';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Auth({ access_roles: [RoleEnum.user, RoleEnum.admin] })
  @Get()
  getCart(@User() user: HydratedUserDocument) {
    return this.cartService.getCart(user);
  }

  @Auth({ access_roles: [RoleEnum.user, RoleEnum.admin] })
  @Post()
  addToCart(
    @Body() body: AddToCartDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.cartService.addToCart(body, user);
  }

  @Auth({ access_roles: [RoleEnum.user, RoleEnum.admin] })
  @Put('remove')
  removeFromCart(
    @Body() body: RemoveFromCartDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.cartService.removeFromCart(body, user);
  }

  @Auth({ access_roles: [RoleEnum.user, RoleEnum.admin] })
  @Put('update-quantity')
  updateProductQuantity(
    @Body() body: UpdateProductQuantityDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.cartService.updateProductQuantity(body, user);
  }

  @Auth({ access_roles: [RoleEnum.user, RoleEnum.admin] })
  @Delete('clear')
  clearCart(@User() user: HydratedUserDocument) {
    return this.cartService.clearCart(user);
  }
}
