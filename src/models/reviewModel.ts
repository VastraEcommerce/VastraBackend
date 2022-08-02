import mongoose, { Model, Schema, Types } from 'mongoose';
import ProductModel from './productModel';

interface IReview {
  product: Types.ObjectId;
  review: string;
  rating: number;
  user: Types.ObjectId;
}

interface ReviewModel extends Model<IReview> {
  calcAverageRatings(productId: any): PromiseLike<any>;
}

interface IStats {
  ratingsQuantity: number;
  ratingsAverage: number;
}

const reviewSchema = new mongoose.Schema<IReview, ReviewModel>({
  product: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'product',
  },
  review: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
  },
  user: {
    type: Schema.Types.ObjectId,
    required: [true, 'Review must belong to a user'],
    ref: 'user',
  },
});

reviewSchema.static(
  'calcAverageRatings',
  async function calcAverageRatings(productId: any) {
    const stats = await this.aggregate<IStats>([
      {
        $match: { product: productId },
      },
      {
        $group: {
          _id: '$product',
          ratingsQuantity: { $sum: 1 },
          ratingsAverage: {
            $avg: '$rating',
          },
        },
      },
    ]);

    if (stats.length > 0) {
      await ProductModel.findByIdAndUpdate(productId, {
        ratingsQuantity: stats[0].ratingsQuantity,
        ratingsAverage: stats[0].ratingsAverage,
      });
    } else {
      await ProductModel.findByIdAndUpdate(productId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      });
    }
  }
);

reviewSchema.post('save', async function () {
  await ReviewModel.calcAverageRatings(this.product);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.post(/^findOneAnd/, async function () {
  await ReviewModel.calcAverageRatings(this.product);
});

reviewSchema.pre(/^find/, function propulateReviewsUers() {
  this.populate({ path: 'user', select: 'name photo' });
});

const ReviewModel = mongoose.model<IReview, ReviewModel>(
  'review',
  reviewSchema
);

export default ReviewModel;
