import mongoose from 'mongoose';
import validator from 'validator';
import variantSchema, { IVariant } from '../schemas/variantSchema';

export interface IProduct {
  category: string;
  brand: string;
  brand_thumbnail: string;
  title: string;
  description: string;
  ratingsAverage: number;
  ratingsQuantity: number;
  variants: IVariant[];
}

export const productShecma = new mongoose.Schema<IProduct>(
  {
    category: {
      type: String,
      required: true,
      enum: ['Shirts', 'Pants', 'T-shirts', 'Sportswear'],
    },
    brand: {
      type: String,
      required: true,
      //! Commeted for only dummy data is not valid
      // validate: [validator.isAlpha, 'Invalid brand name'],
    },
    brand_thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      //! Commeted for only dummy data is not valid
      // validate: [validator.isAlpha, 'Invalid title'],
    },
    description: {
      type: String,
      required: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (value: number) => Math.round(value * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    variants: [
      {
        type: variantSchema,
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'createdAt',
    },
  }
);

const ProductModel = mongoose.model<IProduct>('product', productShecma);

export default ProductModel;
