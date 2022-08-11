import express from 'express';
import { protect, restrictTo } from '../controllers/authController';
import {
  addOrder,
  deleteOrder,
  getAllOrder,
  getOrder,
  setBodyForOrders,
  updateOrder,
} from '../controllers/orderController';

const ordersRouter = express.Router();

ordersRouter.use(protect);

ordersRouter
  .route('/')
  .get(setBodyForOrders, getAllOrder)
  .post(restrictTo('user'), setBodyForOrders, addOrder);

ordersRouter.route('/:id').get(getOrder).patch(updateOrder).delete(deleteOrder);

export default ordersRouter;
