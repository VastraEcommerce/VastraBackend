import mongoose from 'mongoose';
import slugify from 'slugify';
import variantSchema, { IVariant } from '../schemas/variantSchema';
import AppError from '../utils/AppError';
import { isUniqueArray } from '../utils/helperFunctions';

export interface IProduct {
  category: string;
  brand: string;
  brand_thumbnail: string;
  title: string;
  slug: string;
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
      unique: true,
      trim: true,
      //! Commeted for only dummy data is not valid
      // validate: [validator.isAlpha, 'Invalid title'],
    },
    slug: String,
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

productShecma.index({ price: 1, ratingsAverage: -1 });
productShecma.index({ slug: 1 });
// productShecma.index(
//   { _id: 1, 'variants.$.color': 1, 'variants.$.sizes.$.size': 1 },
//   { unique: true }
// );

productShecma.pre('validate', function beforeValidateProduct(next) {
  if (!isUniqueArray(this.variants, 'color')) {
    next(new AppError(`Thare are duplicates of colors`, 400));
  }
  next();
});

productShecma.pre('save', function slugifyTitle(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const ProductModel = mongoose.model<IProduct>('product', productShecma);

export default ProductModel;
