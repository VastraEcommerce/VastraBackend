import { model, Schema, Types } from 'mongoose';

export interface ICart {
  title: string;
  price: number;
  quantity: number;
  description: string;
  image: string;
  brand: string;
  size: string;
  productId: Types.ObjectId;
  user: Types.ObjectId;
}

export const cartSchema = new Schema<ICart>(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: String,
    size: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'product',
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'user',
    },
  },
  {
    timestamps: true,
  }
);

const CartModel = model<ICart>('cart', cartSchema);

export default CartModel;
