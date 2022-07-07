import mongoose from 'mongoose';
import validator from 'validator';

export interface IVariant {
  price: number;
  color: string;
  size: string;
  count: number;
}
const variantSchema = new mongoose.Schema<IVariant>({
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  color: {
    type: String,
    required: true,
    validate: [validator.isHexColor, 'Invalid color'],
  },
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL', 'XXXl'],
  },
  count: {
    type: Number,
    required: true,
    default: 1,
    min: 0,
    validate: [validator.isInt, 'count must be integer'],
  },
});

export default variantSchema;
