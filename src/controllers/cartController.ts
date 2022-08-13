import { NextFunction, Request, Response } from 'express';
import CartModel from '../models/cartModel';
import {
  getOne,
  createModel,
  getAll,
  deleteModel,
  updateModel,
} from '../utils/handlerFactory';
import { CustomRequest } from './authController';

export const getCartItem = getOne(CartModel);
export const addCartItem = createModel(CartModel);
export const getAllCartItems = getAll(CartModel);
export const deleteCartItem = deleteModel(CartModel);
export const updateCartItem = updateModel(CartModel);

export const setBodyForCart = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.body.user = req.body.user
    ? req.body.user
    : (req as CustomRequest).user.id;

  next();
};
