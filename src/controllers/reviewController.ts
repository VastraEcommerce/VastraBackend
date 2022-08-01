import { NextFunction, Request, Response } from 'express';
import ReviewModel from '../models/reviewModel';
import {
  createModel,
  deleteModel,
  getAll,
  getOne,
  updateModel,
} from '../utils/handlerFactory';
import { CustomRequest } from './authController';

export const setBody = (req: Request, res: Response, next: NextFunction) => {
  req.body.user = req.body.user
    ? req.body.user
    : (req as CustomRequest).user.id;

  req.body.product = req.body.product ? req.body.product : req.params.productId;
  next();
};

export const getAllReview = getAll(ReviewModel);
export const getReview = getOne(ReviewModel);
export const deleteReview = deleteModel(ReviewModel);
export const addReview = createModel(ReviewModel);
export const updateReview = updateModel(ReviewModel);
