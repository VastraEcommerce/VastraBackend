import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Types } from 'mongoose';
import isEmail from 'validator/lib/isEmail';
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
    const filteredBody = filterObj(
      req.body,
      'name',
      'email',
      'orders',
      'address'
    );
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

// This route is used only for UI interaction while signing up new users to inform them if the email entered already exists or not
export const isExist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body as { email: string };
    if (!isEmail(email))
      return next(new AppError('Please enter vaild email!', 400));

    const user = await UserModel.findOne({ email });

    res.status(200).json({
      isExist: user ? true : false,
    });
  }
);

/* export const addToCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findByIdAndUpdate(
      (req as CustomRequest).user.id,
      { $push: { cart: req.body.cart } }
    );

    return res.status(200).json({
      status: 'success',
      user,
    });
  }
); */

/* export const removeFromCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findByIdAndUpdate(
      (req as CustomRequest).user.id,
      { $pullAll: { cart: req.body.cart } }
    );

    return res.status(200).json({
      status: 'success',
      user,
    });
  }
);
 */
/* export const getMyCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as CustomRequest).user.id;

    const cart = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      { $unwind: '$cart' },
      {
        $lookup: {
          from: 'products',
          localField: 'cart',
          foreignField: '_id',
          as: 'cart',
        },
      },
      {
        $set: { cart: { $first: '$cart' } },
      },
      {
        $group: {
          _id: '$_id',
          cart: { $push: '$cart' },
          quantity: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          quantity: 1,
          cart: { $first: '$cart' },
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: cart[0],
    });
  }
);
 */
