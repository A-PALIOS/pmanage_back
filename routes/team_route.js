import express from "express";
import {
    getTeams,
    getTeamById,
    getTeamMembersByManagerUUId,
    createTeam,
    updateTeam,
    deleteTeam
} from "../controllers/teams.js";
import { verifyUser, adminOnly,adminOrManagerOnly } from "../middleware/auth_user.js";

const router = express.Router();

// Routes
router.get('/Teams', verifyUser, adminOrManagerOnly, getTeams);
router.get('/Teams/:id', verifyUser, adminOrManagerOnly, getTeamById);
router.get('/TeamsMembers/:managerId',getTeamMembersByManagerUUId);

router.post('/Teams',verifyUser,adminOrManagerOnly ,createTeam);
router.patch('/Teams/:id', verifyUser, adminOrManagerOnly, updateTeam);

router.delete('/Teams/:id', verifyUser, adminOnly, deleteTeam);

export default router;