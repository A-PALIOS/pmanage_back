import express from "express";
import {
    getCustomer,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} from "../controllers/customers.js";
import { verifyUser, adminOnly,adminOrManagerOnly } from "../middleware/auth_user.js";

const router = express.Router();

// Routes
router.get('/Customers', verifyUser, adminOrManagerOnly, getCustomer);
router.get('/Customers/:id', verifyUser, adminOrManagerOnly, getCustomerById);

// Post routes
router.post('/Customers',verifyUser,adminOrManagerOnly ,createCustomer);
router.patch('/Customers/:id', verifyUser, adminOrManagerOnly, updateCustomer);

router.delete('/Customers/:id', verifyUser, adminOnly, deleteCustomer);

export default router;