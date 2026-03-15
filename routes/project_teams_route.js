import express from "express";
import {
    getTeamsForProject,
    getProjectsForTeam,
    assignTeamToProject,
    removeTeamFromProject,
    getUserProjects
} from "../controllers/project_teams.js";
import { verifyUser, adminOnly,adminOrManagerOnly } from "../middleware/auth_user.js";

const router = express.Router();

router.get("/projects/:projectId/teams",verifyUser, adminOrManagerOnly, getTeamsForProject);
router.get("/teams/:teamId/projects",verifyUser, adminOrManagerOnly, getProjectsForTeam);
router.post("/projects/assign-team",verifyUser, adminOrManagerOnly, assignTeamToProject);
router.delete("/projects/:projectId/teams/:teamId",verifyUser, adminOnly, removeTeamFromProject);

//get allowed projects list for user 
router.get("/projects/user/:uuid",verifyUser,getUserProjects);

export default router;
