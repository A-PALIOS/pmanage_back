import express from "express";
import {
    assistantHandler,
    fetchUsersProjectsViaTeams,
    magicButtonHandler,
} from "../controllers/assistant.js";
import { verifyUser, adminOnly,adminOrManagerOnly,connectedUserOnly } from "../middleware/auth_user.js";

const router = express.Router();


// Routes
router.post('/assistant',verifyUser,adminOrManagerOnly,assistantHandler);

router.get("/debug/assignable-projects", async (req, res) => {
    try {
      const data = await fetchUsersProjectsViaTeams();
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

router.post("/magic-button", verifyUser, magicButtonHandler);

export default router;
