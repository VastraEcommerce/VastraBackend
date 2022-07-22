import { Schema } from 'mongoose';
import validator from 'validator';
import AppError from '../utils/AppError';
import { isUniqueArray } from '../utils/helperFunctions';

export interface ISize {
  size: string;
  count: number;
  price: number;
}
export interface IVariant {
  color: string;
  sizes: ISize[];
  images: string[];
}

const sizeSchema = new Schema<ISize>(
  {
    size: {
      type: String,
      required: [true, 'Must have size'],
      enum: ['S', 'M', 'L', 'XL', 'XXL', 'XXXl'],
    },
    count: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
      validate: [
        (val: number) => validator.isInt(`${val}`),
        'count must be integer',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Must have price'],
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const variantSchema = new Schema<IVariant>(
  {
    color: {
      type: String,
      required: true,
      validate: [validator.isHexColor, 'Invalid color'],
    },
    sizes: {
      type: [sizeSchema],
      required: [true, 'Varient must have list of sizes'],
    },
    images: {
      type: [String],
    },
  },
  {
    _id: false,
  }
);

variantSchema.pre('validate', function beforeValidateVariant(next) {
  if (!isUniqueArray(this.sizes, 'size'))
    return next(new AppError(`Thare are duplicates of sizes`, 400));
  next();
});

export default variantSchema;
