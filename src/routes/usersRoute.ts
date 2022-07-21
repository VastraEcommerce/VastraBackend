import express from 'express';
import {
  forgetPassword,
  login,
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
  updateMe,
  updateUser,
} from '../controllers/userControllers';

const usersRouter = express.Router();

usersRouter.post('/signup', signup);
usersRouter.post('/login', login);
usersRouter.post('/forgotPassword', forgetPassword);
usersRouter.patch('/resetPassword/:token', resetPassword);

// All Routes after this middleware will be protected
usersRouter.use(protect);

usersRouter.patch('/updateMyPassword', updatePassword);
usersRouter.get('/me', getMe, getUser);
usersRouter.patch('/updateMe', updateMe);
usersRouter.delete('/deletMe', deleteMe);

// All Routes after this middleware will be restricted to admin only
usersRouter.use(restrictTo('admin'));

usersRouter.route('/').get(getAllUser).post(addUser);
usersRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default usersRouter;
