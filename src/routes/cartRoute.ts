import { Router } from 'express';
import { protect, restrictTo } from '../controllers/authController';
import {
  addCartItem,
  deleteCartItem,
  getAllCartItems,
  getCartItem,
  setBodyForCart,
  updateCartItem,
} from '../controllers/cartController';

const cartRouter = Router({ mergeParams: true });

cartRouter.use(protect, restrictTo('user'));

cartRouter
  .route('/')
  .post(setBodyForCart, addCartItem)
  .get(setBodyForCart, getAllCartItems);

cartRouter
  .route('/:id')
  .get(getCartItem)
  .delete(deleteCartItem)
  .patch(updateCartItem);

export default cartRouter;
