import express from "express";
import {
    getTasks,
    getTaskById,
    getTasksByProjectId,
    createTask,
    updateTask,
    deleteTask
} from "../controllers/tasks.js";
import { verifyUser, adminOnly ,adminOrManagerOnly} from "../middleware/auth_user.js";

const router = express.Router();

// Routes
router.get('/Tasks', verifyUser, getTasks);
router.get('/Tasks/:id', verifyUser, adminOrManagerOnly, getTaskById);
router.get('/Projects/:projectId/tasks', verifyUser, adminOrManagerOnly, getTasksByProjectId);


router.post('/Tasks',verifyUser,adminOrManagerOnly ,createTask);
router.patch('/Tasks/:id', verifyUser, adminOrManagerOnly, updateTask);

router.delete('/Tasks/:id', verifyUser, adminOnly, deleteTask);

export default router;