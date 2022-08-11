import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

export const getCheckoutSession = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // todo 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '', //name,
              description: '',
              // images: ['urls'],
            },
            unit_amount: 2, //amount
          },
          quantity: 1,
        },
      ],
      success_url: `${req.protocol}://${req.get('host')}/success.html`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
    });

    // todo 3) Send session as response
    res.status(200).json({
      status: 'success',
      session,
    });
  }
);
