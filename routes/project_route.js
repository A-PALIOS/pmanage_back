import express from "express";
import {
    getProjects,
    getProjectById,
    getProjectsWithTasks,
    getUserProjects,
    createProject,
    updateProject,
    deleteProject
} from "../controllers/projects.js";
import { verifyUser, adminOnly,adminOrManagerOnly } from "../middleware/auth_user.js";


const router = express.Router();

// Routes
router.get('/Projects', verifyUser, adminOrManagerOnly, getProjects);
router.get('/Projects/:id', verifyUser, adminOrManagerOnly, getProjectById);
router.get('/projects-with-tasks',verifyUser,adminOrManagerOnly,getProjectsWithTasks);
router.get("/user-projects/:userUUId",verifyUser, getUserProjects);

router.post('/Projects',verifyUser,adminOrManagerOnly ,createProject);
router.patch('/Projects/:id', verifyUser, adminOrManagerOnly, updateProject);

router.delete('/Projects/:id', verifyUser, adminOnly, deleteProject);

export default router;