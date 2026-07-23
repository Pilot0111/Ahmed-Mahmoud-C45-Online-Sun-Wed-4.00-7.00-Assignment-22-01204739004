import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  constructor() {}

  createCheckoutSession = async ({
    customer_email,
    metadata,
    line_items,
    discounts,
  }: {
    customer_email: string;
    metadata?: any;
    line_items: any[];
    discounts?: any[];
  }) => {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email,
      metadata,
      success_url: 'http://localhost:3000/order/success',
      cancel_url: 'http://localhost:3000/order/cancel',
      line_items,
      discounts,
    });

    return session;
  };

  async createCoupon(percent_off: number) {
    const coupon = await this.stripe.coupons.create({
      duration: 'once',
      percent_off,
    });
    return coupon;
  }

  async createRefundPayment(payment_intent: string) {
    return await this.stripe.refunds.create({
      payment_intent,
      reason: 'requested_by_customer',
    });
  }
}
