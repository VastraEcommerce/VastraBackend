import { Model, model, Schema, Types } from 'mongoose';
import { cartSchema, ICart } from './cartModel';

export interface IOrder {
  cartItems: ICart[];
  status:
    | 'pendingPayment'
    | 'preparing'
    | 'shipping'
    | 'completed'
    | 'canceled';
  totalPrice: number;
  user: Types.ObjectId;
}

interface OrderModel extends Model<IOrder> {}

const orderSchema = new Schema<IOrder>(
  {
    cartItems: [
      {
        type: cartSchema,
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
      default: 'pendingPayment',
    },
    totalPrice: {
      type: Number,
      required: true,
      default: function () {
        return this.cartItems.reduce(
          (prev: number, curr: { price: number; quantity: number }) =>
            prev + curr.price * curr.quantity,
          0
        );
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const OrderModel = model<IOrder>('order', orderSchema);
export default OrderModel;
