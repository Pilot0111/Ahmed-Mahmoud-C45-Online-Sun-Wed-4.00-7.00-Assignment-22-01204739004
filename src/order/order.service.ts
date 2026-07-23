import { Injectable, BadRequestException, BadGatewayException } from '@nestjs/common';
import { Types } from 'mongoose';
import { StripeService } from '../common/service/stripe.service';
import { OrderRepository } from '../DB/repositories/order.repository';
import { CouponRepository } from '../DB/repositories/coupon.repository';
import { CartRepository } from '../DB/repositories/cart.repository';
import { ProductRepository } from '../DB/repositories/product.repository';
import { CreateOrderDto } from './dto/order.dto';
import { HydratedUserDocument } from '../DB/models/user.model';
import {
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from '../common/enum/order.enum';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly couponRepository: CouponRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly stripeService: StripeService,
  ) {}

  async createOrder(body: CreateOrderDto, user: HydratedUserDocument) {
    const { address, couponCode, paymentMethod, phone } = body;

    let coupon;
    if (couponCode) {
      coupon = await this.couponRepository.findOne({
        filter: {
          code: couponCode.toLowerCase(),
          usedBy: { $nin: [user._id] },
        },
      });

      if (!coupon) {
        throw new BadGatewayException("coupon not exist or used it before");
      }
    }

    const cart = await this.cartRepository.findOne({
      filter: { createdBy: user._id },
    });

    if (!cart || !cart.products.length) {
      throw new BadRequestException('Cart not found');
    }

    for (const product of cart.products) {
      const productExist = await this.productRepository.findOne({
        filter: {
          _id: product.productId,
          stock: { $gte: product.quantity },
        },
      });

      if (!productExist) {
        throw new BadRequestException('Product not found or out of stock');
      }
    }

    const order = await this.orderRepository.create({
      userId: user._id,
      coupon: coupon ? coupon._id : undefined,
      address,
      cart: cart._id,
      phone,
      totalPrice: coupon
        ? cart.subTotal - cart.subTotal * (coupon.amount / 100)
        : cart.subTotal,
      paymentMethod,
      // I fixed the confusion with the Enums here.
      status: OrderStatus.PENDING,
      paymentStatus:
        paymentMethod === PaymentMethod.CASH
          ? PaymentStatus.UNPAID // Cash on delivery is unpaid initially
          : PaymentStatus.PAID, // Card is usually paid upfront
    });
    if (!order) {
      throw new BadRequestException('Order not created');
    }

    for (const product of cart.products) {
      await this.productRepository.findOneAndUpdate({
        filter: { _id: product.productId },
        update: { $inc: { stock: -product.quantity } },
      });
    }

    if (couponCode) {
      await this.couponRepository.findOneAndUpdate({
        filter: { code: couponCode.toLowerCase() },
        update: { $push: { usedBy: user._id } },
      });
    }
if (paymentMethod === PaymentMethod.CASH) {
    await this.cartRepository.findOneAndUpdate({
      filter: { createdBy: user._id },
      update: { products: [] },
    });
  }
    return { message: 'Order created successfully', order };
  }

  async paymentWithStripe(orderId: Types.ObjectId, user: HydratedUserDocument) {
    const order = await this.orderRepository.findOne({
      filter: { _id: orderId },
      populate: [
        {
          path: 'cart',
          populate: [{ path: 'products.productId' }],
        },
        {
          path: 'coupon',
        },
      ],
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    let coupon: any;
    if (order?.coupon) {
      coupon = await this.stripeService.createCoupon(
        (order.coupon as any).amount,
      );
    }

    const session = await this.stripeService.createCheckoutSession({
      customer_email: user.email,
      metadata: {
        orderId: order._id.toString(),
      },
      line_items: order.cart['products'].map((product: any) => {
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.productId.name,
            },
            unit_amount: product.finalPrice * 100, // Stripe expects amount in cents
          },
          quantity: product.quantity,
        };
      }),
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
    });

    return session;
  }

  async webhook(body: any) {
    const orderId = body.data.object.metadata.orderId;
    const paymentIntent = body.data.object.payment_intent;

    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        _id: orderId,
      },
      update: {
        paymentStatus: PaymentStatus.PAID,
        orderChanges: {
          paidAt: new Date(),
        },
        paymentIntent,
      },
    });

    return order;
  }

  async refundOrder(id: Types.ObjectId, user: HydratedUserDocument) {
    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        _id: id,
        paymentStatus: { $in: [PaymentStatus.PAID] },
        paymentMethod: PaymentMethod.CARD,
      },
      update: {
        paymentStatus: PaymentStatus.REFUNDED,
        orderChanges: {
          refundAt: new Date(),
        },
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    await this.stripeService.createRefundPayment(order.paymentIntent);

    return order;
  }
}
