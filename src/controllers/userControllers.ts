import UserModel from '../models/userModel';
import {
  createModel,
  deleteModel,
  getAll,
  getOne,
  updateModel,
} from '../utils/handlerFactory';

export const getAllUser = getAll(UserModel);
export const getUser = getOne(UserModel);
export const deleteUser = deleteModel(UserModel);
export const addUser = createModel(UserModel);
export const updateUser = updateModel(UserModel);
