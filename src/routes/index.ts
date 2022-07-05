import { Router } from 'express';
import ordersRouter from './orderRoute';
import productsRouter from './productRoute';
import reviewsRouter from './reviewRoute';
import usersRouter from './usersRoute';

const indexRouter = Router();

indexRouter.use('/users', usersRouter);
indexRouter.use('/reviews', reviewsRouter);
indexRouter.use('/orders', ordersRouter);
indexRouter.use('/products', productsRouter);

export default indexRouter;
