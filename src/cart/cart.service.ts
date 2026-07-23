import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CartRepository } from 'src/DB/repositories/cart.repository';
import { ProductRepository } from 'src/DB/repositories/product.repository';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { AddToCartDto, RemoveFromCartDto, UpdateProductQuantityDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async getCart(user: HydratedUserDocument) {
    let cart = await this.cartRepository.findOne({ filter: { createdBy: user._id } });
    if (!cart) {
      cart = await this.cartRepository.create({
        createdBy: user._id,
        products: [],
        subTotal: 0,
      });
    }
    return { message: 'Cart retrieved successfully', cart };
  }

  async addToCart(body: AddToCartDto, user: HydratedUserDocument) {
    const { productId, quantity } = body;

    const product = await this.productRepository.findOne({ 
      filter: { 
        _id: productId, 
        stock: { $gte: quantity },
        deletedAt: { $exists: false } 
      } 
    });
    
    if (!product) {
      throw new BadRequestException('Product not found or out of stock');
    }

    let cart = await this.cartRepository.findOne({ filter: { createdBy: user._id } });
    
    if (!cart) {
      const newCart = await this.cartRepository.create({
        createdBy: user._id,
        products: [
          {
            productId: product._id,
            quantity,
            finalPrice: product.price,
          }
        ],
        subTotal: 0,
      });
      return { message: 'Product added to cart', cart: newCart };
    }

    const productExist = cart.products.find(
      (p) => p.productId.toString() === productId.toString()
    );

    if (productExist) {
      throw new BadRequestException('Product already in cart');
    }

    cart.products.push({
      productId: product._id as any,
      quantity,
      finalPrice: product.price,
    });

    const updatedCart = await cart.save();
    return { message: 'Product added to cart', cart: updatedCart };
  }

  async removeFromCart(body: RemoveFromCartDto, user: HydratedUserDocument) {
    const { productId } = body;

    const productExists = await this.productRepository.findOne({ filter: { _id: productId } });
    if (!productExists) {
      throw new BadRequestException('Product not found');
    }

    const cart = await this.cartRepository.findOne({ 
      filter: { 
        createdBy: user._id,
        'products.productId': productId
      } 
    });
    
    if (!cart) {
      throw new BadRequestException('Cart not exist');
    }

    cart.products = cart.products.filter(
      (p) => p.productId.toString() !== productId.toString()
    );

    const updatedCart = await cart.save();
    return { message: 'Product removed from cart', cart: updatedCart };
  }

  async updateProductQuantity(body: UpdateProductQuantityDto, user: HydratedUserDocument) {
    const { productId, quantity } = body;

    const cart = await this.cartRepository.findOne({
      filter: {
        createdBy: user._id,
        'products.productId': productId,
      },
    });

    if (!cart) {
      throw new BadRequestException('Cart not exist');
    }

    cart.products.find((product) => {
      if (product.productId.toString() === productId.toString()) {
        product.quantity += quantity;
        return product;
      }
    });

    const updatedCart = await cart.save();
    return { message: 'Product quantity updated', cart: updatedCart };
  }

  async clearCart(user: HydratedUserDocument) {
    const cart = await this.cartRepository.findOne({ filter: { createdBy: user._id } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.products = [];
    const updatedCart = await cart.save();
    return { message: 'Cart cleared', cart: updatedCart };
  }
}
