import { NextFunction, Request, RequestHandler, Response } from 'express';
import UserModel from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import {
  deleteModel,
  getAll,
  getOne,
  updateModel,
} from '../utils/handlerFactory';
import { CustomRequest } from './authController';
interface IFillteredBody {
  name?: string;
  email?: string;
  photo?: string;
}

const filterObj = (obj: any, ...filteredFeilds: string[]) => {
  let newObj: IFillteredBody = {};
  Object.keys(obj).forEach((el) => {
    //@ts-ignore
    if (filteredFeilds.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Not allowed Update Password
export const getAllUser = getAll(UserModel);
export const getUser = getOne(UserModel);
export const updateUser = updateModel(UserModel);
export const deleteUser = deleteModel(UserModel);

export const addUser: RequestHandler = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use singup instead.',
  });
};

export const deleteMe = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    await UserModel.findByIdAndUpdate(req.user.id, { active: false });
    return res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = (req as CustomRequest).user.id;
  next();
};

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // todo 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword route',
          400
        )
      );
    }

    // todo 2) Filltered out unwanted fields names that not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    console.log({ filteredBody });

    // ?For fileuploads of profile image
    // if (req.file) filteredBody.photo = req.file.filename;

    // todo 3) Update user document
    const user = await UserModel.findByIdAndUpdate(
      (req as CustomRequest).user.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: 'success',
      user,
    });
  }
);
