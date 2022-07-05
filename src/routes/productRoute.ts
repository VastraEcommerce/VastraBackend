import express from 'express';
import {
    addProduct,
    deleteProduct,
    getAllProduct,
    getProduct,
    updateProduct,
} from '../controllers/productController';
const productsRouter = express.Router();

productsRouter.route('/').get(getAllProduct).post(addProduct);
productsRouter.route('/:id').get(getProduct).patch(updateProduct).delete(deleteProduct);

export default productsRouter;
