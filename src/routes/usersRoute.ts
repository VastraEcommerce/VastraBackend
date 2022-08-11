import express from 'express';
import {
  forgetPassword,
  handleRefreshToken,
  login,
  logout,
  protect,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from '../controllers/authController';
import {
  addUser,
  deleteMe,
  deleteUser,
  getAllUser,
  getMe,
  getUser,
  isExist,
  updateMe,
  updateUser,
} from '../controllers/userControllers';

const usersRouter = express.Router();

usersRouter.post('/signup', signup);
usersRouter.post('/login', login);
usersRouter.post('/forgotPassword', forgetPassword);
usersRouter.patch('/resetPassword/:token', resetPassword);
usersRouter.post('/isExist', isExist);
usersRouter.get('/refresh', handleRefreshToken);

// All Routes after this middleware will be protected
usersRouter.use(protect);

usersRouter.post('/logout', logout);
usersRouter.patch('/updateMyPassword', updatePassword);
usersRouter.get('/me', getMe, getUser);
usersRouter.patch('/updateMe', updateMe);
usersRouter.delete('/deleteMe', deleteMe);

// All Routes after this middleware will be restricted to admin only
usersRouter.use(restrictTo('admin'));

usersRouter.route('/').get(getAllUser).post(addUser);
usersRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default usersRouter;
