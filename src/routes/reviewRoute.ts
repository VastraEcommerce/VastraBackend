import express from 'express';
import {
    addReview,
    deleteReview,
    getAllReview,
    getReview,
    updateReview,
} from '../controllers/reviewController';
const reviewsRouter = express.Router();

reviewsRouter.route('/').get(getAllReview).post(addReview);
reviewsRouter.route('/:id').get(getReview).patch(updateReview).delete(deleteReview);

export default reviewsRouter;
