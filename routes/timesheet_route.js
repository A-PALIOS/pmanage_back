import express from "express";
import {
    //timesheets
    getAllTimesheets,
    getTimesheetById,
    getTimesheetsByUser,
    getTimesheetsByTask,
    getTimesheetsByProject,
    getUserTimesheetsForWeek,
    getUserTimesheetsApi,
    ///statistics
    getUserWeeklyTimesheets,
    getUserMonthlyTimesheets,
    getUserYearlyTimesheets,
    getWeeklySummaryForAllUsers,
    getMonthlySummaryForAllUsers,
    getYearlySummaryForAllUsers,
    getprojectDetails,
    //timesheets
    createTimesheet,
    updateTimesheet,
    bulkUpdateTimesheets,
    deleteTimesheet
    
} from "../controllers/timesheets.js";
import { verifyUser, adminOnly,adminOrManagerOnly } from "../middleware/auth_user.js";

const router = express.Router();

// Routes GET
router.get('/Timesheets', verifyUser, getAllTimesheets);
router.get('/Timesheets/:timesheetId',verifyUser,getTimesheetById)
router.get('/Timesheets/user/:userUUID', verifyUser, getTimesheetsByUser);
router.get('/Timesheets/task/:taskId', verifyUser, getTimesheetsByTask);
router.get('/Timesheets/project/:projectId', verifyUser, getTimesheetsByProject);
router.get("/timesheets/:userUUId/:startDate",verifyUser, getUserTimesheetsForWeek);
router.get("/Timesheets/api/:userUUID/:startdate/:endate",verifyUser,getUserTimesheetsApi);

//Routes GET for statistics
router.get('/Statistics/week/:userUUID/:date',verifyUser,getUserWeeklyTimesheets);
router.get('/Statistics/month/:userUUID/:date',verifyUser,getUserMonthlyTimesheets);
router.get('/Statistics/year/:userUUID/:year',verifyUser,getUserYearlyTimesheets);
router.get('/Statistics/all/week/:date',verifyUser,getWeeklySummaryForAllUsers);
router.get('/Statistics/all/month/:date',verifyUser,getMonthlySummaryForAllUsers);
router.get('/Statistics/all/year/:year',verifyUser,getYearlySummaryForAllUsers);
router.get('/Statistics/projectDetails/:projectId',verifyUser,getprojectDetails)



// routes post patch
router.post('/Timesheets',verifyUser,adminOrManagerOnly ,createTimesheet);
router.patch('/Timesheets/:id', verifyUser, adminOrManagerOnly, updateTimesheet);
router.post("/timesheets/bulk-update/:uuid",verifyUser, bulkUpdateTimesheets);


//routes delete
router.delete('/Timesheets/:id', verifyUser, adminOnly, deleteTimesheet);


export default router;