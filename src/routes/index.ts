import { Router } from 'express';
import cartRouter from './cartRoute';
import ordersRouter from './orderRoute';
import productsRouter from './productRoute';
import reviewsRouter from './reviewRoute';
import usersRouter from './usersRoute';

const indexRouter = Router();

indexRouter.use('/users', usersRouter);
indexRouter.use('/reviews', reviewsRouter);
indexRouter.use('/orders', ordersRouter);
indexRouter.use('/products', productsRouter);
indexRouter.use('/cartItems', cartRouter);

export default indexRouter;
