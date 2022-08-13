import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import CartModel from '../models/cartModel';
import OrderModel from '../models/orderModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { CustomRequest } from './authController';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

export const getCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, email } = (req as CustomRequest).user;

    const cartItems = await CartModel.find({ user: id });

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
          images: [`${process.env.BACKEND_DASE_URL}/${cartItem.image}`],
        },
        unit_amount: cartItem.price * 100, //amount
      },
      quantity: cartItem.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      client_reference_id: id,
      line_items,
      success_url: `${process.env.FORENTEND_BASE_URL!}/`,
      cancel_url: `${process.env.FORENTEND_BASE_URL!}/cart`,
      metadata: { userId: id },
    });

    if (!session) {
      return next(new AppError('There is no session', 404));
    }

    // Make orders status `pendingPayment`
    await OrderModel.create({
      cartItems,
      user: id,
      status: 'pendingPayment',
    });

    res.status(200).json({
      status: 'success',
      url: session.url,
    });
  }
);

const preparingOrders = async (session: Stripe.Event.Data.Object) => {
  const userId = (session as { metadata: { userId: string } }).metadata.userId;

  // Update order status to `perparing`
  await OrderModel.findOneAndUpdate(
    {
      user: userId,
    },
    { status: 'preparing' }
  );

  // Delete CartItems after payment
  await CartModel.deleteMany({ user: userId });
};

export const webhook = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook Error: ${(err as { message: string }).message}`);
      res
        .status(400)
        .send(`Webhook Error: ${(err as { message: string }).message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // console.log({ session });
        await preparingOrders(session);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  }
);
