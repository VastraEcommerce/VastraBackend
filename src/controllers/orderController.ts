import OrderModel from '../models/orderModel';
import {
    createModel,
    deleteModel,
    getAll,
    getOne,
    updateModel,
} from '../utils/handlerFactory';

export const getAllOrder = getAll(OrderModel);
export const getOrder = getOne(OrderModel);
export const deleteOrder = deleteModel(OrderModel);
export const addOrder = createModel(OrderModel);
export const updateOrder = updateModel(OrderModel);
