import Timesheets from "../models/timesheet_model.js";
import Users from "../models/user_model.js";
import Projects from "../models/project_model.js";
import Tasks from "../models/task_model.js";
import { Op } from "sequelize";
import { startOfWeek,endOfWeek, format,addDays,getDay,startOfMonth,endOfMonth,getDate,startOfYear,endOfYear, getMonth } from "date-fns";
import Customers from "../models/customer_model.js";


// CREATE TIMESHEET ENTRY
export const createTimesheet = async (req, res) => {
    try {
        const { user_id, project_id, task_id, date, hours, description } = req.body;

        const userId = await getUserIdByUuid(user_id);

        const timesheet = await Timesheets.create({
            user_id:userId,
            project_id:project_id,
            task_id:task_id,
            date:date,
            hours:hours,
            //
            description: description ?? null
        });

        res.status(201).json(timesheet);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET ALL TIMESHEETS
export const getAllTimesheets = async (req, res) => {
    try {
        const timesheets = await Timesheets.findAll({
            include: [
                { model: Users, attributes: ["id","uuid", "name"] },
                { model: Projects, attributes: ["id", "name"] },
                { model: Tasks, attributes: ["id", "name"] }
            ]
        });

        res.status(200).json(timesheets);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET ALL TIMESHEETS BY ID
export const getTimesheetById = async (req, res) => {

    try {
        const { timesheetId } = req.params;
        const timesheets = await Timesheets.findOne({
            where:{id:timesheetId},
            include: [
                { model: Users, attributes: ["id","uuid", "name"] },
                { model: Projects, attributes: ["id", "name"] },
                { model: Tasks, attributes: ["id", "name"] }
            ]
        });

        res.status(200).json(timesheets);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
///GET ALL USER TIMESHEETS OF SELECTED WEEK
export const getUserTimesheetsForWeek = async (req, res) => {
    try {
        const { userUUId, startDate } = req.params;

        const userId = await getUserIdByUuid(userUUId);

        const monday = new Date(startDate);
        const sunday = new Date(startDate);
        sunday.setDate(monday.getDate() + 6); 

        const timesheets = await Timesheets.findAll({
            where: {
                user_id: userId,
                date: {
                    [Op.between]: [monday, sunday]
                }
            }
        });

        res.status(200).json(timesheets);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const getUserIdByUuid = async (uuid) => {
    const user = await Users.findOne({
        where: { uuid },
        attributes: ["id"],
    });
    return user ? user.id : null;
};

// GET TIMESHEETS BY USER ID
export const getTimesheetsByUser = async (req, res) => {
    try {
        const { userUUID } = req.params;

        const userId = await getUserIdByUuid(userUUID);

        if (!userId) return res.status(404).json({ msg: "User not found" });

        const timesheets = await Timesheets.findAll({
            where: { user_id: userId },
            include: [{ model: Projects }, { model: Tasks }]
        });

        res.status(200).json(timesheets);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET TIMESHEETS BY PROJECT ID
export const getTimesheetsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const timesheets = await Timesheets.findAll({
            where: { project_id: projectId },
            include: [{ model: Users }, { model: Tasks }]
        });

        res.status(200).json(timesheets);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET TIMESHEETS BY TASK ID
export const getTimesheetsByTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const timesheets = await Timesheets.findAll({
            where: { task_id: taskId },
            include: [{ model: Users }, { model: Projects }]
        });

        res.status(200).json(timesheets);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// UPDATE TIMESHEET ENTRY
export const updateTimesheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, hours, description } = req.body;

        const timesheet = await Timesheets.findByPk(id);
        if (!timesheet) return res.status(404).json({ msg: "Timesheet not found" });

        await timesheet.update({
            date: date ,
            hours: hours,
            //
            // description: description ?? timesheet.description 
            description: description === "" ? null : (description ?? timesheet.description)
        });

        res.status(200).json({ msg: "Timesheet updated successfully", timesheet });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// DELETE TIMESHEET ENTRY
export const deleteTimesheet = async (req, res) => {
    try {
        const { id } = req.params;

        const timesheet = await Timesheets.findByPk(id);
        if (!timesheet) return res.status(404).json({ msg: "Timesheet not found" });

        await timesheet.destroy();
        res.status(200).json({ msg: "Timesheet deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};



/////WEEKLY REPORT BULK CREATE UPDATE DELETE

export const bulkUpdateTimesheets = async (req, res) => {
    try {
        
        const { uuid } = req.params;

        const userId = await getUserIdByUuid(uuid);

        if (!userId) return res.status(404).json({ msg: "User not found" });
        
        for (const entry of req.body) {
            const { project_id, task_id, date, hours, description } = entry;

            const existing = await Timesheets.findOne({
                where: { user_id:userId, project_id:project_id, task_id:task_id, date:date }
            });
            

            if (existing) {
                if (hours === 0) {
                    await existing.destroy();
                } else {
                    await existing.update({ hours, description: description ?? null });
                }
            } else if (hours > 0) {
                await Timesheets.create({  user_id:userId, project_id:project_id, task_id:task_id, date:date, hours:hours, description: description ?? null });
            }
        }

        res.json({ message: "Timesheets updated successfully" });
    } catch (error) {
        console.error("Bulk update error:", error);
        res.status(500).json({ error: "Failed to update timesheets" });
    }
};


////Api 
export const getUserTimesheetsApi = async (req, res) => {
    try {
        const { userUUID, startdate ,endate} = req.params;

        const userId = await getUserIdByUuid(userUUID);

        if (!userId || !startdate || !endate) {
            return res.status(400).json({ error: "Missing required parameters: user_id and date." });
        }

        const fromDate = startOfWeek(new Date(startdate), { weekStartsOn: 1 });

        const timesheets = await Timesheets.findAll({
            where: {
                user_id:userId,
                date: {
                    [Op.gte]: startdate, 
                    [Op.lte]: endate,
                },
            },
            include: [
                { model: Projects, attributes: ["id", "name"] },
                { model: Tasks, attributes: ["id", "name"] },
            ],
            order: [["date", "ASC"]],
        });


        const groupedWeeks = {};
        timesheets.forEach((entry) => {
            const weekStart = format(startOfWeek(new Date(entry.date), { weekStartsOn: 1 }), "yyyy-MM-dd");

            if (!groupedWeeks[weekStart]) {
                groupedWeeks[weekStart] = {};
            }


            groupedWeeks[format(new Date(entry.date), "yyyy-MM-dd")] = 
            // {
            //     project: {
            //         id: entry.project?.id || null,
            //         name: entry.project?.name || null
            //     },
            //     task: {
            //         id: entry.task?.id || null,
            //         name: entry.task?.name || null
            //     },
            //     hours: entry.hours,
            // };
            {
               
                project_id: entry.project?.id || null,
                project_name: entry.project?.name || null,
            
                task_id: entry.task?.id || null,
                task_name: entry.task?.name || null,
                hours: entry.hours,
                //
                description:entry.description ?? null
            };
        });

        //response json
        res.json({
            user_id: userId,
            timesheets: timesheets,
        });
    } catch (error) {
        console.error("Error fetching timesheets:", error);
        res.status(500).json({ error: "Failed to fetch user timesheets" });
    }
};

/////statistics pages
export const getUserWeeklyTimesheets = async (req, res) => {

    try {
        
        const { userUUID, date } = req.params;
        console.log("useruuid",userUUID," date",date);

        const userId = await getUserIdByUuid(userUUID);
        if (!userId || !date) {
            return res.status(400).json({ error: "Missing required parameters: user_id and date." });
        }

        const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(date), { weekStartsOn: 1 });

        const weekDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const weekDays = {};
        for (let i = 0; i < 7; i++) {
            const day = addDays(weekStart, i);
            weekDays[weekDayNames[getDay(day)]] = 0; // Default hours = 0
        }

        const timesheets = await Timesheets.findAll({
            where: {
                user_id: userId,
                date: { [Op.between]: [weekStart, weekEnd] },
            },
            include: [
                { model: Projects, attributes: ["id", "name"] },
                { model: Tasks, attributes: ["id", "name"] },
            ],
            order: [["date", "ASC"]],
        });

        const projectsMap = {};

        timesheets.forEach((entry) => {
            const projectId = entry.project.id;
            const taskId = entry.task.id;
           // const formattedDate = format(new Date(entry.date), "yyyy-MM-dd");
            const formattedDate = weekDayNames[getDay(new Date(entry.date))];

            if (!projectsMap[projectId]) {
                projectsMap[projectId] = {
                    project_id: projectId,
                    project_name: entry.project.name,
                    total_hours: 0,
                    tasks: {},
                };
            }

            if (!projectsMap[projectId].tasks[taskId]) {
                projectsMap[projectId].tasks[taskId] = {
                    task_id: taskId,
                    task_name: entry.task.name,
                    daily_hours: {...weekDays },
                };
            }

            projectsMap[projectId].total_hours = Number(projectsMap[projectId].total_hours)+ Number(entry.hours);

            projectsMap[projectId].tasks[taskId].daily_hours[formattedDate] = (projectsMap[projectId].tasks[taskId].daily_hours[formattedDate] || 0) + entry.hours;
        
        })

        const responseData = {
            user_id: userId,
            week_start: format(weekStart, "yyyy-MM-dd"),
            projects: Object.values(projectsMap).map((project) => ({
                ...project,
                tasks: Object.values(project.tasks),
            })),
        };

        res.json(responseData);

    } catch (error) {
        console.error("Error fetching user timesheets:", error);
        res.status(500).json({ error: "Failed to fetch user timesheets" });
    }

}


export const getUserMonthlyTimesheets = async (req, res) => {

    try {
        
        const { userUUID, date } = req.params;
        console.log("useruuid",userUUID," date",date);

        const userId = await getUserIdByUuid(userUUID);
        if (!userId || !date) {
            return res.status(400).json({ error: "Missing required parameters: user_id and date." });
        }

        const monthStart = startOfMonth(new Date(date), { weekStartsOn: 1 });
        const monthEnd = endOfMonth(new Date(date), { weekStartsOn: 1 });

        //const weekDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const monthDays = {};
        for (let i = 1; i <= getDate(monthEnd); i++) {
            const dayKey = format(new Date(date).setDate(i), "yyyy-MM-dd");
            monthDays[dayKey] = 0; // Default hours = 0
        }

        const timesheets = await Timesheets.findAll({
            where: {
                user_id: userId,
                date: { [Op.between]: [monthStart, monthEnd] },
            },
            include: [
                { model: Projects, attributes: ["id", "name"] },
                { model: Tasks, attributes: ["id", "name"] },
            ],
            order: [["date", "ASC"]],
        });

        const projectsMap = {};

        timesheets.forEach((entry) => {
            const projectId = entry.project.id;
            const taskId = entry.task.id;
            const formattedDate = format(new Date(entry.date), "yyyy-MM-dd");

            if (!projectsMap[projectId]) {
                projectsMap[projectId] = {
                    project_id: projectId,
                    project_name: entry.project.name,
                    total_hours: 0,
                    tasks: {},
                };
            }

            if (!projectsMap[projectId].tasks[taskId]) {
                projectsMap[projectId].tasks[taskId] = {
                    task_id: taskId,
                    task_name: entry.task.name,
                    daily_hours: {...monthDays},
                };
            }

            projectsMap[projectId].total_hours = Number(projectsMap[projectId].total_hours)+ Number(entry.hours);

            projectsMap[projectId].tasks[taskId].daily_hours[formattedDate] = (projectsMap[projectId].tasks[taskId].daily_hours[formattedDate] || 0) + entry.hours;
        
        })

        const responseData = {
            user_id: userId,
            month_start: format(monthStart, "yyyy-MM-dd"),
            month_end: format(monthEnd, "yyyy-MM-dd"),
            projects: Object.values(projectsMap).map((project) => ({
                ...project,
                tasks: Object.values(project.tasks),
            })),
        };

        res.json(responseData);

    } catch (error) {
        console.error("Error fetching user timesheets:", error);
        res.status(500).json({ error: "Failed to fetch user timesheets" });
    }

}


export const getUserYearlyTimesheets = async (req, res) => {
    try {
        const { userUUID, year } = req.params;

        console.log("Fetching timesheets for:", userUUID, "Year:", year);

        const userId = await getUserIdByUuid(userUUID);
        if (!userId || !year) {
            return res.status(400).json({ error: "Missing required parameters: userUUID and year." });
        }

        const yearStart = startOfYear(new Date(`${year}-01-01`));
        const yearEnd = endOfYear(new Date(`${year}-12-31`));

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const yearlyData = {};
        monthNames.forEach((month) => {
            yearlyData[month] = {
                total_hours: 0,
                projects: {},
            };
        });

        const timesheets = await Timesheets.findAll({
            where: {
                user_id: userId,
                date: { [Op.between]: [yearStart, yearEnd] },
            },
            include: [
                { model: Projects, attributes: ["id", "name"] },
                { model: Tasks, attributes: ["id", "name"] },
            ],
            order: [["date", "ASC"]],
        });

        timesheets.forEach((entry) => {
            const projectId = entry.project.id;
            const taskId = entry.task.id;
            const month = monthNames[new Date(entry.date).getMonth()];

            if (!yearlyData[month].projects[projectId]) {
                yearlyData[month].projects[projectId] = {
                    project_id: projectId,
                    project_name: entry.project.name,
                    total_hours: 0,
                    tasks: {},
                };
            }

            if (!yearlyData[month].projects[projectId].tasks[taskId]) {
                yearlyData[month].projects[projectId].tasks[taskId] = {
                    task_id: taskId,
                    task_name: entry.task.name,
                    total_hours: 0,
                };
            }

            yearlyData[month].total_hours =Number(yearlyData[month].total_hours )+ Number(entry.hours);
            yearlyData[month].projects[projectId].total_hours=Number(yearlyData[month].projects[projectId].total_hours) + Number(entry.hours);
            yearlyData[month].projects[projectId].tasks[taskId].total_hours =Number(yearlyData[month].projects[projectId].tasks[taskId].total_hours) + Number(entry.hours);
        });

        const responseData = {
            user_id: userUUID,
            year: year,
            months: Object.entries(yearlyData).map(([monthName, data]) => ({
                month: monthName,
                total_hours: data.total_hours,
                projects: Object.values(data.projects).map((project) => ({
                    ...project,
                    tasks: Object.values(project.tasks),
                })),
            })),
        };

        res.json(responseData);
    } catch (error) {
        console.error("Error fetching user timesheets:", error);
        res.status(500).json({ error: "Failed to fetch user timesheets" });
    }
};


export const getWeeklySummaryForAllUsers = async (req, res) => {

    try {
        
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ error: "Date parameter is required." });
        }

        const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(date), { weekStartsOn: 1 });

        //GET TIMESHEETS FOR GIVE DATES
        const timesheets = await Timesheets.findAll({
            where: {
                date: { [Op.between]: [weekStart, weekEnd] },
            },
            include: [
                { model: Users, attributes: ["id", "uuid", "name"] },
                { model: Projects, attributes: ["id", "name"] }
            ],
            order: [["date", "ASC"]],
        });

        if (!timesheets.length) {
            return res.json({ message: "No timesheets found for the given week." });
        }
        
        const userSummaryMap = {};

        timesheets.forEach(entry => {
            const userId = entry.user.id;
            const projectId = entry.project.id;
            const date = format(new Date(entry.date), "yyyy-MM-dd");

            if (!userSummaryMap[userId]) {
                userSummaryMap[userId] = {
                    user_id: entry.user.id,
                    user_uuid: entry.user.uuid,
                    user_name: entry.user.name,
                    total_hours: 0,
                    overtime_alert: false,
                    days_worked: new Set(), //UNIQUE
                    projects: {}
                };
            }

            userSummaryMap[userId].total_hours += Number(entry.hours);
            userSummaryMap[userId].days_worked.add(date);

            if (!userSummaryMap[userId].projects[projectId]) {
                userSummaryMap[userId].projects[projectId] = {
                    project_id: projectId,
                    project_name: entry.project.name,
                    total_hours: 0,
                };
            }

            userSummaryMap[userId].projects[projectId].total_hours += Number(entry.hours);
        });

        
        const weeklySummary = Object.values(userSummaryMap).map(user => {
            //SUM DAYS WORKED THIS WEEK
            user.days_worked = user.days_worked.size;

            //IF TOTAL>40 OVERTIME TRUE
            user.overtime_alert = user.total_hours > 40;

            //TOP 3 PROJECTS
            user.projects = Object.values(user.projects)
                .sort((a, b) => b.total_hours - a.total_hours) //DESCENDING
                .slice(0, 3); //KEEP TOP 3

            return user;
        });

        
        res.json({ week_start: format(weekStart, "yyyy-MM-dd"), users: weeklySummary });


    } catch (error) {
        console.error("Error fetching weekly summary:", error);
        res.status(500).json({ error: "Failed to fetch weekly summary." });
    }

}


export const getMonthlySummaryForAllUsers = async (req, res) => {
    try {
        const { date } = req.params; 
        if (!date) {
            return res.status(400).json({ error: "Date parameter is required." });
        }

        const monthStart = startOfMonth(new Date(date));
        const monthEnd = endOfMonth(new Date(date));

        const timesheets = await Timesheets.findAll({
            where: {
                date: { [Op.between]: [monthStart, monthEnd] },
            },
            include: [
                { model: Users, attributes: ["id", "uuid", "name"] },
                { model: Projects, attributes: ["id", "name"] }
            ],
            order: [["date", "ASC"]],
        });

        if (!timesheets.length) {
            return res.json({ message: "No timesheets found for the given month." });
        }

        const userSummaryMap = {};

        timesheets.forEach(entry => {
            const userId = entry.user.id;
            const projectId = entry.project.id;
            const date = format(new Date(entry.date), "yyyy-MM-dd");

            if (!userSummaryMap[userId]) {
                userSummaryMap[userId] = {
                    user_id: entry.user.id,
                    user_uuid: entry.user.uuid,
                    user_name: entry.user.name,
                    total_hours: 0,
                    overtime_alert: false,
                    days_worked: new Set(), 
                    projects: {}
                };
            }

            userSummaryMap[userId].total_hours += Number(entry.hours);
            userSummaryMap[userId].days_worked.add(date);

            if (!userSummaryMap[userId].projects[projectId]) {
                userSummaryMap[userId].projects[projectId] = {
                    project_id: projectId,
                    project_name: entry.project.name,
                    total_hours: 0,
                };
            }

            userSummaryMap[userId].projects[projectId].total_hours += Number(entry.hours);
        });

        const monthlySummary = Object.values(userSummaryMap).map(user => {
            user.days_worked = user.days_worked.size;

            user.overtime_alert = user.total_hours > 160;

            user.projects = Object.values(user.projects)
                .sort((a, b) => b.total_hours - a.total_hours)
                .slice(0, 3);

            return user;
        });

        res.json({ month_start: format(monthStart, "yyyy-MM-dd"), users: monthlySummary });

    } catch (error) {
        console.error("Error fetching monthly summary:", error);
        res.status(500).json({ error: "Failed to fetch monthly summary." });
    }
};

export const getYearlySummaryForAllUsers = async (req, res) => {
    try {
        const { year } = req.params; 
        if (!year || isNaN(year)) {
            return res.status(400).json({ error: "year parameter is required." });
        }

        const yearStart = startOfYear(new Date(`${year}-01-01`));
        const yearEnd = endOfYear(new Date(`${year}-12-31`));

        const timesheets = await Timesheets.findAll({
            where: {
                date: { [Op.between]: [yearStart, yearEnd] },
            },
            include: [
                { model: Users, attributes: ["id", "uuid", "name"] },
                { model: Projects, attributes: ["id", "name"] }
            ],
            order: [["date", "ASC"]],
        });

        if (!timesheets.length) {
            return res.json({ message: "No timesheets found for the given month." });
        }

        const userSummaryMap = {};

        timesheets.forEach(entry => {
            const userId = entry.user.id;
            const projectId = entry.project.id;
            const date = format(new Date(entry.date), "yyyy-MM-dd");

            if (!userSummaryMap[userId]) {
                userSummaryMap[userId] = {
                    user_id: entry.user.id,
                    user_uuid: entry.user.uuid,
                    user_name: entry.user.name,
                    total_hours: 0,
                    overtime_alert: false,
                    days_worked: new Set(),
                    projects: {}
                };
            }

            userSummaryMap[userId].total_hours += Number(entry.hours);
            userSummaryMap[userId].days_worked.add(date);

            if (!userSummaryMap[userId].projects[projectId]) {
                userSummaryMap[userId].projects[projectId] = {
                    project_id: projectId,
                    project_name: entry.project.name,
                    total_hours: 0,
                };
            }

            userSummaryMap[userId].projects[projectId].total_hours += Number(entry.hours);
        });

        const yearlySummary = Object.values(userSummaryMap).map(user => {
            user.days_worked = user.days_worked.size;

            user.overtime_alert = user.total_hours > 160 * 12;

            user.projects = Object.values(user.projects)
                .sort((a, b) => b.total_hours - a.total_hours)
                .slice(0, 3);

            return user;
        });

        res.json({ year_start: format(yearStart, "yyyy-MM-dd"), users: yearlySummary });

    } catch (error) {
        console.error("Error fetching monthly summary:", error);
        res.status(500).json({ error: "Failed to fetch monthly summary." });
    }
};

export const getprojectDetails = async(req,res)=>{
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required." });
        }

        const timesheets = await Timesheets.findAll({
            where: { project_id: projectId },
            include: [
                { model: Users, attributes: ["id", "uuid", "name"] },
                { model: Projects, attributes: ["id", "name"],
                    include:[{ model: Customers, attributes: ["id", "name"] }]
                 },
                { model: Tasks, attributes: ["id", "name"] }
                

            ],
            order: [["date", "ASC"]],
        });

        if (!timesheets.length) {
            return res.json({ message: "No timesheets found for this project." });
        }

        let totalProjectHours = 0;
        const userHours = {};
        const taskHours = {};
        const yearHours = {};

        timesheets.forEach(entry => { 

            const userId = entry.user_id;
            const taskId = entry.task_id;
            const hours = Number(entry.hours)
            const year = new Date(entry.date).getFullYear();
            const month = new Date(entry.date).getMonth();

            totalProjectHours += hours;

            if(!userHours[userId]){
                userHours[userId]={
                    user_id:userId,
                    user_uuid:entry.user.uuid,
                    user_name: entry.user.name,
                    total_hours:0
                };
            }
            userHours[userId].total_hours += hours;

            if (!taskHours[taskId]) {
                taskHours[taskId] = {
                    task_id: taskId,
                    task_name: entry.task.name,
                    total_hours: 0,
                };
            }
            taskHours[taskId].total_hours += hours;

            if (!yearHours[year]) {
                yearHours[year] = {
                    year: year,
                    total_hours: 0,
                    months: Array(12).fill(0)
                };
            }
            yearHours[year].total_hours += hours;
            yearHours[year].months[month] += hours;

        });

        res.json({
            project_id: projectId,
            project_name: timesheets[0].project.name,
            customer_id:timesheets[0].project.customer.id,
            customer_name:timesheets[0].project.customer.name,
            total_hours: totalProjectHours,
            users: Object.values(userHours),
            tasks: Object.values(taskHours),
            years: Object.values(yearHours),
        });

    } catch (error) {
        console.error("Error fetching project details:", error);
        res.status(500).json({ error: "Failed to fetch project details." });
    }
}