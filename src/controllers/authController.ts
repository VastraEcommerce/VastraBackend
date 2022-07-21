import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import UserModel, { IUser } from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import sendEmail from '../utils/email';

export interface CustomRequest extends Request {
  user: {
    id: string;
    role: IUser['role'];
  };
}

const SECRET_KEY = process.env.JWT_SECRET_KEY!;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN!;
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN!;

const signToken = (id: Types.ObjectId) =>
  jwt.sign({ id }, SECRET_KEY, { expiresIn: EXPIRES_IN });

const createSendToken = (
  user: mongoose.Document & IUser,
  statusCode: number,
  res: Response
) => {
  const token = signToken(user._id);
  //#region
  const cookieOptions = {
    expires: new Date(
      Date.now() + +JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  //#endregion

  // Remove password from output
  (user.password as unknown as undefined) = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, password, passwordConfirm, role } = <IUser>req.body;
    const newUser = await UserModel.create({
      name,
      email,
      password,
      passwordConfirm,
      role,
    });
    return createSendToken(newUser, 201, res);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = <IUser>req.body;

    // todo 1) check if email and password exist
    if (!email || !password)
      next(new AppError('Please provide email and password!', 400));

    // todo 2) check if user exists && password is correct
    const user = await UserModel.findOne({ email }).select('+password');

    const isCorrect = await user?.isPasswordCorrect(password, user.password);

    if (!user || !isCorrect)
      return next(new AppError('Incorrect email or password', 401));

    // todo 3) If everything ok, send token to client
    return createSendToken(user, 200, res);
  }
);

export const protect = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    // todo 1) Getting the token and check if it exit
    let token;
    if (req.headers?.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    console.log({ token });

    if (!token)
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );

    // todo 2) Varification token
    const decoded = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    console.log({ decoded });

    // todo 3) Check if user still exists
    const currentUser = await UserModel.findById(decoded.id);
    if (!currentUser)
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401
        )
      );

    // todo 4) Check if user changed password after the token was issued
    if (currentUser.isPasswordChangedAfterThisToken(decoded.iat))
      return next(
        new AppError('The user changed password after this token', 401)
      );

    // ? GRANT ACCESS TO PRODUCTED ROUTE
    req.user = { id: currentUser.id, role: currentUser.role };
    return next();
  }
);

export const restrictTo =
  (...roles: IUser['role'][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as CustomRequest).user?.role!)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    return next();
  };

export const forgetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // todo 1) Get user based on POSTed email
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user)
      return next(
        new AppError('There is no user with this email address', 404)
      );

    // todo 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // todo 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forget your password? Submit a PATCH request with your new password and password confirm to:
    ${resetURL}
    If you didn't forget your password, Pleae ignore this email`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message,
      });

      return res
        .status(200)
        .json({ status: 'success', message: 'Token sent to email' });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending the email. Try again later',
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // todo 1) Get user based on the token
    // The same algorithm is used in createPasswordResetToken in userModel.js
    const hashedToken = crypto // Create the same token which is suposed saved in database
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Search for user which has this token that didn't expire yet
    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordRestExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Token has expired or invalid', 400));

    // todo 2) If token has not expired, and there is user, set the new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // todo 3) Update changesPasswordAt property for user
    await user.save();

    // todo 4) Log the user in, Send JWT
    return createSendToken(user, 200, res);
  }
);

export const updatePassword = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword, newPasswordConfirm } = req.body;

    // todo 1) Get user from collection
    const user = await UserModel.findById(req.user.id).select('+password');
    // todo 2) Check if POSTed current password is correct
    if (!(await user?.isPasswordCorrect(oldPassword, user.password))) {
      return next(new AppError('Your old password is incorrect', 401));
    }

    // todo 3) If so, update password
    if (user) {
      // type guard
      user.password = newPassword;
      user.passwordConfirm = newPasswordConfirm;
      await user.save();
      // ? User.findByIdAndUpdate() will not work the schema validation
      // todo 4) Log user in, send JWT
      return createSendToken(user, 200, res);
    }
  }
);
