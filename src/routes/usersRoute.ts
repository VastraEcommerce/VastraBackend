import express from 'express';
import {
  forgetPassword,
  login,
  resetPassword,
  signup,
} from '../controllers/authController';
import {
  addUser,
  deleteUser,
  getAllUser,
  getUser,
  updateUser,
} from '../controllers/userControllers';
const usersRouter = express.Router();

usersRouter.post('/signup', signup);
usersRouter.post('/login', login);
usersRouter.post('/forgotPassword', forgetPassword);
usersRouter.patch('/resetPassword/:token', resetPassword);

// Must be producted and only accessed by admin only

usersRouter.route('/').get(getAllUser).post(addUser);
usersRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default usersRouter;
