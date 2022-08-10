import ProductModel from '../models/productModel';
import {
  createModel,
  deleteModel,
  getAll,
  getOne,
  updateModel,
} from '../utils/handlerFactory';

export const getAllProduct = getAll(ProductModel);
export const getProduct = getOne(ProductModel);
export const deleteProduct = deleteModel(ProductModel);
export const addProduct = createModel(ProductModel);
export const updateProduct = updateModel(ProductModel);
