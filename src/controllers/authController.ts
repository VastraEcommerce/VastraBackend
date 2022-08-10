import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import mongoose from 'mongoose';
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

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const ACCESS_TOKEN_SECRET_EXPIRES_IN =
  process.env.ACCESS_TOKEN_SECRET_EXPIRES_IN!;

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET_EXPIRES_IN =
  process.env.REFRESH_TOKEN_SECRET_EXPIRES_IN!;

const JWT_COOKIE_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_COOKIE_EXPIRES_IN!;

const cookieOptions = {
  expires: new Date(Date.now() + +JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  same: 'None',
};

const createToken = (
  user: mongoose.Document & IUser,
  tokenType: 'access' | 'refresh'
) => {
  const id = user._id;
  const role = user.role;
  switch (tokenType) {
    case 'access':
      return jwt.sign({ id, role }, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_SECRET_EXPIRES_IN,
      });
    case 'refresh':
      return jwt.sign({ id, role }, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_SECRET_EXPIRES_IN,
      });
  }
};

const sendToken = async (
  statusCode: number,
  req: Request,
  res: Response,
  user: mongoose.Document & IUser,
  accessToken: string,
  newRefreshToken: string,
  newRefreshTokenArray: string[],
  cookieOptions: any
) => {
  // Saving refreshTokens with current user
  user.refreshToken = [...newRefreshTokenArray, newRefreshToken];

  await user.save();

  res.cookie('jwt', newRefreshToken, cookieOptions);

  // Remove password from output
  (user.password as unknown as undefined) = undefined;
  (user.refreshToken as unknown as undefined) = undefined;
  (user.role as unknown as undefined) = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: accessToken,
    user,
  });
};

const createSendToken = async (
  user: mongoose.Document & IUser,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const cookies = req.cookies;
  const accessToken = createToken(user, 'access');
  const newRefreshToken = createToken(user, 'refresh');
  let newRefreshTokenArray = !cookies?.jwt
    ? user.refreshToken || []
    : user.refreshToken?.filter((rt) => rt !== cookies.jwt) || [];

  if (process.env.NODE_ENV === 'production')
    cookieOptions.secure =
      req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (cookies?.jwt) {
    /* 
    Scenario added here:
      1) User logs in but never uses REFRESH TOKEN and does not logout
      2) REFRESH TOKEN is stolen.
      3) If 1 & 2, reuse detection is needed to clear all REFRESH TOKENs when user logs in
    */

    const refreshToken = cookies.jwt;
    const foundToken = await UserModel.findOne({ refreshToken });

    // Detected refresh token reuse!
    if (!foundToken) {
      // Clear out All previous refresh tokens
      newRefreshTokenArray = [];
    }

    res.clearCookie('jwt', cookieOptions);
  }

  sendToken(
    statusCode,
    req,
    res,
    user,
    accessToken,
    newRefreshToken,
    newRefreshTokenArray,
    cookieOptions
  );
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
    // return createSendToken(newUser, 201, req, res);
    res.status(201).json({
      status: 'success',
      newUser,
    });
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

    // todo 3) If everything ok, send a accessToken to the client
    return await createSendToken(user, 200, req, res);
  }
);

export const protect = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    // todo 1) Getting the accessToken and checking if it exit
    let accessToken;
    if (req.headers?.authorization?.startsWith('Bearer')) {
      accessToken = req.headers.authorization.split(' ')[1];
    }
    if (!accessToken)
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );

    // todo 2) Varification accessToken
    let decoded;
    try {
      decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as jwt.JwtPayload;
    } catch (error) {
      if ((error as TokenExpiredError).message === 'jwt expired') {
        next(new AppError('access Token expired', 403));
      }
    }

    // todo 3) Check if the user still exists
    const currentUser = await UserModel.findById(decoded?.id);
    if (!currentUser)
      return next(
        new AppError(
          'The user belonging to this accessToken does no longer exist.',
          401
        )
      );

    // todo 4) Check if the user changed the password after the accessToken was issued
    if (currentUser.isPasswordChangedAfterThisToken(decoded?.iat))
      return next(
        new AppError(
          'The user changed the password after this accessToken',
          401
        )
      );

    // ? GRANT ACCESS TO PROTECTED ROUTE
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

    // todo 2) Generate the random reset accessToken
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // todo 3) Send it to the user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forget your password? Submit a PATCH request with your new password and password confirm to:
    ${resetURL}
    If you didn't forget your password, Please ignore this email`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset accessToken (valid for 10 min)',
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
    // todo 1) Get the user based on the accessToken
    // The same algorithm is used in createPasswordResetToken in userModel.js
    const hashedToken = crypto // Create the same accessToken which is supposed saved in a database
      .createHash('sha256')
      .update(req.params.accessToken)
      .digest('hex');

    // Search for the user who has this accessToken that didn't expire yet
    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordRestExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Token has expired or invalid', 400));

    // todo 2) If the accessToken has not expired, and there is a user, set the new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // todo 3) Update changesPasswordAt property for user
    await user.save();

    // todo 4) Log the user in, Send JWT
    return createSendToken(user, 200, req, res);
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
      return createSendToken(user, 200, req, res);
    }
  }
);

export const handleRefreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return next(new AppError('Unauthorized', 401));

    const refreshToken = cookies.jwt;
    const foundUser = await UserModel.findOne({
      refreshToken,
    });
    if (!foundUser) return next(new AppError('Forbidden not found user', 403));

    jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET,
      // @ts-ignore
      async (err: jwt.VerifyErrors, decoded: jwt.JwtPayload) => {
        if (err || foundUser._id.toHexString() !== decoded.id) {
          return next(new AppError(`Forbidden error`, 403));
        }
        const accessToken = createToken(foundUser, 'access');
        res.json({ token: accessToken });
      }
    );
  }
);

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // On client, also delete the accessToken

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    // Is refreshToken in DB?
    const foundUser = await UserModel.findOne({ refreshToken });

    if (!foundUser) {
      res.clearCookie('jwt', cookieOptions);
      return res.sendStatus(204);
    }

    // Delete refreshToken in DB
    foundUser.refreshToken = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    const result = await foundUser.save();

    res.clearCookie('jwt', cookieOptions);
    res.sendStatus(204);
  }
);
