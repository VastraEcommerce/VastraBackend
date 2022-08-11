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

cartRouter.post('/', setBodyForCart, addCartItem);
cartRouter.get('/', setBodyForCart, getAllCartItems);
cartRouter.get('/:id', getCartItem);
cartRouter.delete('/:id', deleteCartItem);
cartRouter.patch('/:id', updateCartItem);

export default cartRouter;
