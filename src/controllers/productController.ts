import ProductModel from '../models/productModel';
import { NextFunction, Request, RequestHandler, Response } from 'express';

import {
  createModel,
  deleteModel,
  getAll,
  getOne,
  updateModel,
} from '../utils/handlerFactory';

import { upload } from "../utils/uploadConfig"

export const getAllProduct = getAll(ProductModel);
export const getProduct = getOne(ProductModel);
export const deleteProduct = deleteModel(ProductModel);
export const addProduct = createModel(ProductModel);
export const updateProduct = updateModel(ProductModel);
export const uploadImages = (req: Request, res: Response, next: NextFunction) => {

  res.status(201).json({
    status: 'success',
    data: req.files
  });
}
