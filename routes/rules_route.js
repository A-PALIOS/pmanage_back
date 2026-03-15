import express from "express";
import { getRule, updateRule } from "../controllers/rules.js";
import { verifyUser, adminOnly } from "../middleware/auth_user.js";

const router = express.Router();

router.get('/rules', verifyUser, getRule);
router.patch('/rules', verifyUser, adminOnly, updateRule);

export default router;
