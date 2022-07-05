import { ErrorRequestHandler, NextFunction, Response, Request } from 'express';
import { CastError, Error } from 'mongoose';
import AppError from '../utils/AppError';

const handleJWTExpiredError = () =>
  new AppError('Expired Token, Please login again.', 401);

const handleJWTError = () =>
  new AppError('Invalid Token, Please login again.', 401);

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values<Error>(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err: CastError) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value:${value}. Please use anothor value!`;

  return new AppError(message, 400);
};

const sendErrorDev = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'CastError') err.statusCode = 400;
  if (err.code === 11000) err.statusCode = 400;
  if (err.name === 'ValidationError') err.statusCode = 400;
  if (err.name === 'JsonWebTokenError') err.statusCode = 401;
  if (err.name === 'TokenExpiredError') err.statusCode = 401;
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error:send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or other unknow error: don't leak error details
  else {
    console.error('Error 💥💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

const globalErrorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  console.log({ err });
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res, next);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

    sendErrorProd(err, res);
  }
};

export default globalErrorHandler;
