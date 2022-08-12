import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import CartModel from '../models/cartModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { CustomRequest } from './authController';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

export const getCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as CustomRequest).user.id;

    const cartItems = await CartModel.find({ user: id });

    console.log({ cartItems });
    if (cartItems.length === 0) {
      return next(
        new AppError('There are not cart items for current user.', 404)
      );
    }

    const line_items = cartItems?.map((cartItem) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: cartItem.title, //name,
          description: cartItem.description,
          images: [cartItem.image],
        },
        unit_amount: cartItem.price * 100, //amount
      },
      quantity: cartItem.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${req.protocol}://${req.get('host')}/`,
      cancel_url: `${req.protocol}://${req.get('host')}/cart`,
    });

    console.log({ session });

    if (!session) {
      return next(new AppError('There is no session', 404));
    }

    // todo 3) Send session as response

    if (process.env.NODE_ENV === 'production') res.redirect(session.url!);
    else
      res.status(200).json({
        status: 'success',
        session,
      });
  }
);
