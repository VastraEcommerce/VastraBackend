import ReviewModel from '../models/reviewModel';
import {
    createModel,
    deleteModel,
    getAll,
    getOne,
    updateModel,
} from '../utils/handlerFactory';

export const getAllReview = getAll(ReviewModel);
export const getReview = getOne(ReviewModel);
export const deleteReview = deleteModel(ReviewModel);
export const addReview = createModel(ReviewModel);
export const updateReview = updateModel(ReviewModel);
