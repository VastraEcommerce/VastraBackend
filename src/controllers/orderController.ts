import { NextFunction, Request, Response } from 'express';
import OrderModel from '../models/orderModel';
import {
  createModel,
  deleteModel,
  getAll,
  getOne,
  updateModel,
} from '../utils/handlerFactory';
import { CustomRequest } from './authController';

export const getAllOrder = getAll(OrderModel);
export const getOrder = getOne(OrderModel);
export const deleteOrder = deleteModel(OrderModel);
export const addOrder = createModel(OrderModel);
export const updateOrder = updateModel(OrderModel);

export const setBodyForOrders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log({ user: (req as CustomRequest).user });

  if ((req as CustomRequest)?.user.role === 'admin') {
    console.log({ body: req.body });
    return next();
  }

  req.body.user = req.body.user
    ? req.body.user
    : (req as CustomRequest).user.id;

  return next();
};
