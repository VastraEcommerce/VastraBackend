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

export const productSchema = new mongoose.Schema<IProduct>(
  {
    category: {
      type: String,
      trim: true,
      required: true,
      enum: ['women', 'men', 'kids'],
    },
    brand: {
      type: String,
      required: true,
      //! Commeted for only dummy data is not valid
      // validate: [validator.isAlpha, 'Invalid brand name'],
    },
    brand_thumbnail: {
      type: String,
      // required: true,
      trim: true,
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
      trim: true,
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

productSchema.index({ ratingsAverage: -1 });
productSchema.index({ slug: 1 });
// productSchema.index(
//   { _id: 1, 'variants.$.color': 1, 'variants.$.sizes.$.size': 1 },
//   { unique: true }
// );

productSchema.pre('validate', function beforeValidateProduct(next) {
  if (!isUniqueArray(this.variants, 'color')) {
    next(new AppError(`Thare are duplicates of colors`, 400));
  }
  next();
});

productSchema.pre('save', function slugifyTitle(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const ProductModel = mongoose.model<IProduct>('product', productSchema);

export default ProductModel;
