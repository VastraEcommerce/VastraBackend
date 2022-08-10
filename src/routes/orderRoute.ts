import express from 'express';
import {
  addOrder,
  deleteOrder,
  getAllOrder,
  getOrder,
  updateOrder,
} from '../controllers/orderController';
const ordersRouter = express.Router();

ordersRouter.route('/').get(getAllOrder).post(addOrder);
ordersRouter.route('/:id').get(getOrder).patch(updateOrder).delete(deleteOrder);

export default ordersRouter;
