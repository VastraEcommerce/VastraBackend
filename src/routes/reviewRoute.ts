import express from 'express';
import { protect, restrictTo } from '../controllers/authController';
import {
  addReview,
  deleteReview,
  getAllReview,
  getReview,
  setBody,
  updateReview,
} from '../controllers/reviewController';

const reviewsRouter = express.Router({ mergeParams: true });

// POST /product/1321/reviews
// GET /product/1321/reviews

reviewsRouter.get('/', getAllReview);

reviewsRouter.use(protect);

reviewsRouter.post('/', restrictTo('user'), setBody, addReview);

reviewsRouter
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('admin', 'user'), updateReview)
  .delete(restrictTo('admin', 'user'), deleteReview);

export default reviewsRouter;
