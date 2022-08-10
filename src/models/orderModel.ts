import mongoose from 'mongoose';
import { IProduct, productShecma } from './productModel';

export interface IOrder {
  products: IProduct[];
  status:
    | 'pendingPayment'
    | 'preparing'
    | 'shipping'
    | 'completed'
    | 'canceled';
  totalPrice: number;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    products: [
      {
        type: productShecma,
        required: true,
      },
    ],
    status: {
      type: String,
      required: true,
      enum: [
        'pendingPayment',
        'preparing',
        'shipping',
        'completed',
        'canceled',
      ],
    },
    totalPrice: {
      type: Number,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
    },
  }
);

const OrderModel = mongoose.model<IOrder>('order', orderSchema);
export default OrderModel;
