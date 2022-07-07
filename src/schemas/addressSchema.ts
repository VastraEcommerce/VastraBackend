import mongoose from 'mongoose';

export interface IAddress {
  city: string;
  street: string;
  buliding: string;
  country: string;
  purpose: string;
}

const addressSchema = new mongoose.Schema<IAddress>({
  city: {
    type: String,
  },
  street: {
    type: String,
  },
  buliding: {
    type: String,
  },
  country: {
    type: String,
  },
  purpose: {
    type: String,
    enum: ['payment', 'delivery'],
  },
});

export default addressSchema;
