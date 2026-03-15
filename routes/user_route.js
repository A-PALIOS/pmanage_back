// import express from "express";
// import {
//     getUsers,
//     getUserById,
//     createUser,
//     updateUser,
//     deleteUser
// } from "../controllers/Users.js"
// import { verifyUser,adminOnly } from "../middleware/AuthUser.js";

// const router = express.Router();

// router.get('/users',verifyUser,adminOnly, getUsers);
// router.get('/users/:id',verifyUser,adminOnly,getUserById);
// router.post('/users',createUser);
// router.patch('/users/:id',verifyUser,adminOnly,updateUser);
// router.delete('/users/:id',verifyUser,adminOnly,deleteUser);


// export default router;
import express from "express";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/Users.js";
import { verifyUser, adminOnly,adminOrManagerOnly,connectedUserOnly } from "../middleware/auth_user.js";

const router = express.Router();

// Routes
router.get('/users', verifyUser, getUsers);
router.get('/users/:id', verifyUser, connectedUserOnly, getUserById);

router.post('/users',adminOnly ,createUser);
router.patch('/users/:id', verifyUser, connectedUserOnly, updateUser);

router.delete('/users/:id', verifyUser, adminOnly, deleteUser);

export default router;
