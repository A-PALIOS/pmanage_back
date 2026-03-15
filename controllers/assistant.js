import e from "express";
import User from "../models/user_model.js";
import argon2 from "argon2";
import dotenv from "dotenv"
import db from "../config/database.js";

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
// import { tool } from "@langchain/core/tools";
import * as z from "zod";
// import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { createAgent , tool } from "langchain";

import Users from "../models/user_model.js";
import { Op, fn, col } from "sequelize";
import {startOfWeek, endOfWeek, formatISO ,subWeeks} from "date-fns"
import Timesheets from "../models/timesheet_model.js";
import Teams from "../models/teams_model.js";
import Projects from "../models/project_model.js";
import Customers from "../models/customer_model.js";
import Tasks from "../models/task_model.js";

dotenv.config();

// const model = new ChatGroq({
//     model:"llama-3.3-70b-versatile",
//     temperature:0,
//     apiKey:process.env.GROQ_API_KEY,
// })

///NEEDS THIS TO WORKS OTHERWISE I WOULD HAVE TO UPDATE NODE VERSION WHICH MIGHT BREAK SOME LIBRARIES (HAS SOMETHING TO DO WITH INFO @TYPES LIBARY)
if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any !== "function") {
    AbortSignal.any = function any(signals) {
      const controller = new AbortController();
  
      function onAbort() {
        controller.abort();
        for (const signal of signals) {
          signal.removeEventListener("abort", onAbort);
        }
      }
  
      for (const signal of signals) {
        if (signal.aborted) {
          controller.abort();
          break;
        }
        signal.addEventListener("abort", onAbort);
      }
  
      return controller.signal;
    };
  }

function toLcMessages(messages) {
    return messages.map((m) => {
      if (m.role === "system"){
        return new SystemMessage(m.content);
      }else if (m.role === "assistant"){
        return new AIMessage(m.content);
      }else{
        return new HumanMessage(m.content);
      }      
    });
  }

// export const assistantHandler = async(req,res)=>{

//     try {
//         const {messages}=req.body

//         if(!Array.isArray(messages) || messages.length===0){
//             return res.status(400).json({msg:"messages array is empty or is of different type"})
//         }

//         const lcMessages = toLcMessages(messages);

//         const model = new ChatGroq({
//             model:"llama-3.3-70b-versatile",
//             temperature:0,
//             apiKey:process.env.GROQ_API_KEY,
//         })

//         const reply = await model.invoke(lcMessages);

//         return res.json({
//             reply:reply.content?.toString?.() ?? reply.content,
//         })
        
//     } catch (error) {
//         console.log("assistant handler error",error)
//         return res.status(500).json({msg:"internal server error"})
//     }
// }

// export const assistantHandler = async (req, res) => {
//     const { messages } = req.body;

//     try {
//         if (!Array.isArray(messages) || messages.length === 0) {
//           return res.status(400).json({ msg: "messages array is required" });
//         }

//         // Take the last user message, or just use a dummy prompt
//         const last = messages[messages.length - 1];
//         const prompt = last?.content || "Say hello";

//         // Simple call to Groq (no tools yet)
//         const reply = await model.invoke([new HumanMessage(prompt)]);

//         console.log("Assistant raw reply:", reply);

//         return res.json({ reply: reply.content?.toString?.() ?? reply.content });
//     } catch (error) {
//         console.error("assistantHandler error:", error);
//         res.status(500).json({ msg: "Internal server error" });
//     }
// };


// TOOLS

//GET CURRENT SERVER TIME
const getCurrentTime = tool(
    ()=>{
        const now = new Date();
        return{
            nowISO:now.toISOString(),
            nowLocal:now.toLocaleString(),
        };
    },
    {
        name: "get_current_time",
        description: "Get the current server date and time",
        schema:z
        .object({})
        .nullable()   
        .optional(), // SOMETIMES THE MODEL SEND NULL OR UNDEFINDED ISTEAD OF {} AND IT SHOWS AS ERRO SO I ACCEPT THESE RESPONSES TOO 
    }
);

//GET USER INFO BY UUID OR NAME
const getUserInfo = tool(
    async({identifier}) =>{
        try {
            const user = await User.findOne({
                where:{
                    [Op.or]:[{name:identifier},{uuid:identifier}]
                },
                attributes: { exclude: ["password"]}
            });
    
            if(!user){
                return { error:"User not found", identifier};
            }
    
            return user.toJSON();
        } catch (err) {
            return {error: err.message, identifier}
        }
        
    },
    {
        name: "get_user_info",
        description:"Get user information by name or uuid from the users table.",
        schema:z.object({
            identifier: z
            .string()
            .describe("the name or uuid of the user to look up.")
        })
    }
 
);

// GET THIS WEEKS DATA FOR ALL USERS (GENERAL INFO)
// const getCurrentWeekOverview = tool(
//     async () => {
//       const now = new Date();
//       const weekStart = startOfWeek(now, { weekStartsOn: 1 });
//       const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
//       const [results] = await db.query(
//         `
//         SELECT 
//           u.name AS name,
//           u.email AS email,
//           u.role AS role,
//           SUM(t.hours) AS totalHours
//         FROM timesheets t
//         JOIN users u ON t.user_id = u.id
//         WHERE t.date BETWEEN :weekStart AND :weekEnd
//         GROUP BY u.id, u.name, u.email, u.role
//         ORDER BY totalHours DESC;
//         `,
//         {
//           replacements: {
//             weekStart: formatISO(weekStart, { representation: "date" }),
//             weekEnd: formatISO(weekEnd, { representation: "date" }),
//           },
//         }
//       );
  
//       return {
//         weekStart: formatISO(weekStart, { representation: "date" }),
//         weekEnd: formatISO(weekEnd, { representation: "date" }),
//         results,
//       };
//     },
//     {
//       name: "get_current_week_overview",
//       description:
//         "Get each user's total logged hours for this week (Monday–Sunday), grouped and ordered by total hours.",
//       schema: z.object({}).optional(),
//     }
//   );

// // GET THIS WEEKS DATA FOR ALL USERS (GENERAL INFO)
// const getLastWeekOverview = tool(
//     async () => {
//       const now = new Date();
//       const weekStart = startOfWeek(subWeeks(now,1), { weekStartsOn: 1 });
//       const weekEnd = endOfWeek(subWeeks(now,1), { weekStartsOn: 1 });
  
//       const [results] = await db.query(
//         `
//         SELECT 
//           u.name AS name,
//           u.email AS email,
//           u.role AS role,
//           SUM(t.hours) AS totalHours
//         FROM timesheets t
//         JOIN users u ON t.user_id = u.id
//         WHERE t.date BETWEEN :weekStart AND :weekEnd
//         GROUP BY u.id, u.name, u.email, u.role
//         ORDER BY totalHours DESC;
//         `,
//         {
//           replacements: {
//             weekStart: formatISO(weekStart, { representation: "date" }),
//             weekEnd: formatISO(weekEnd, { representation: "date" }),
//           },
//         }
//       );
  
//       return {
//         weekStart: formatISO(weekStart, { representation: "date" }),
//         weekEnd: formatISO(weekEnd, { representation: "date" }),
//         results,
//       };
//     },
//     {
//       name: "get_last_week_overview",
//       description:
//         "Get each user's total logged hours for last week (Monday–Sunday), grouped and ordered by total hours.",
//       schema: z.object({}).optional(),
//     }
//   );

// GET WEEKLY DATA FOR ALL USERS (GENERAL INFO) FOR (0 THIS WEEK,1 PREVIOUS WEEK AND SO ON AND SO FORTH)
const getWeekOverview = tool(
  async (input) => {
    const parsed = z
      .object({
        weeksAgo: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe("0=this week, 1=last week, 2=two weeks ago"),
      })
      .parse(input ?? {});
    const { weeksAgo } = parsed;

    const target = subWeeks(new Date(), weeksAgo);
    const weekStart = startOfWeek(target, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(target, { weekStartsOn: 1 });

    const [results] = await db.query(
      `
        SELECT 
          u.name AS name,
          u.email AS email,
          u.role AS role,
          SUM(t.hours) AS totalHours
        FROM timesheets t
        JOIN users u ON t.user_id = u.id
        WHERE t.date BETWEEN :weekStart AND :weekEnd
        GROUP BY u.id, u.name, u.email, u.role
        ORDER BY totalHours DESC;
        `,
      {
        replacements: {
          weekStart: formatISO(weekStart, { representation: "date" }),
          weekEnd: formatISO(weekEnd, { representation: "date" }),
        },
      }
    );

    return {
      weeksAgo,
      weekStart: formatISO(weekStart, { representation: "date" }),
      weekEnd: formatISO(weekEnd, { representation: "date" }),
      results,
    };
  },
  {
    name: "get_week_overview",
    description:
      "Get each user's total logged hours for a week relative to now. Pass weeksAgo (0=this week, 1=last week, 2=two weeks ago).",
    schema: z
      .object({
        weeksAgo: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe("0=this week, 1=last week, 2=two weeks ago"),
      })
      .nullable()
      .optional(),
  }
);



export async function fetchUsersProjectsViaTeams() {
  //GET TEAM DATA WITH USERS AND PROJECTS
  const teams = await Teams.findAll({
    attributes: ["id", "name"],
    include: [
      {
        model: Users,
        attributes: ["id", "name", "email", "role"],
        through: { attributes: [] },
      },
      {
        model: Projects,
        attributes: ["id", "name"],
        through: { attributes: [] },
      },
    ],
    order: [["name", "ASC"]],
  });

  const plainTeams = teams.map((t) => t.get({ plain: true }));

  //USER PROJECTS NAMES STRUCTURE
  const userMap = new Map();

  for (const team of plainTeams) {
    const teamProjects = team.projects ?? [];
    const teamUsers = team.users ?? [];

    for (const u of teamUsers) {
      let entry = userMap.get(u.id);
      if (!entry) {
        entry = {
          user_id: u.id,
          user: u.name,
          email: u.email,
          role: u.role,
          projects: [],
        };
        userMap.set(u.id, entry);
      }

      // Only project names here
      for (const p of teamProjects) {
        if (!entry.projects.includes(p.name)) {
          entry.projects.push(p.name);
        }
      }
    }
  }

  const users_projects = Array.from(userMap.values());

  // 3) Get full project meta separately
  const allProjects = await Projects.findAll({
    attributes: ["id", "name", "status", "due_date"],
    order: [
      ["due_date", "ASC"],
      ["name", "ASC"],
    ],
  });

  const projects_meta = allProjects.map((p) => p.get({ plain: true }));

  return { users_projects, projects_meta };
}

export const getAssignableProjectsOverview = tool(
    async()=>await fetchUsersProjectsViaTeams(),
    {
        name:"get_assignable_projects_overview",
        description:
        "Return (1) each user's accessible projects via team membership and (2) all projects with status/due_date for prioritization.",
        schema:z.object({}).nullable().optional(),
    }
)

const resolveUserId = async (identifier) => {
  const user = await Users.findOne({
    where: { [Op.or]: [{ uuid: identifier }, { name: identifier }, { email: identifier }] },
    attributes: ["id", "uuid", "name", "email", "role"],
  });
  return user ? user.get({ plain: true }) : null;
};

const resolveProject = async (identifier) => {
  const where =
    typeof identifier === "number"
      ? { id: identifier }
      : { [Op.or]: [{ name: identifier }, { id: Number(identifier) || -1 }] };

  const project = await Projects.findOne({
    where,
    attributes: ["id", "name", "status", "due_date", "description"],
  });
  return project ? project.get({ plain: true }) : null;
};

const resolveTeamWithUsers = async (identifier) => {
  const where =
    typeof identifier === "number"
      ? { id: identifier }
      : { [Op.or]: [{ name: identifier }, { id: Number(identifier) || -1 }] };

  const team = await Teams.findOne({
    where,
    attributes: ["id", "name"],
    include: [
      {
        model: Users,
        attributes: ["id", "uuid", "name", "email", "role"],
        through: { attributes: [] },
      },
    ],
  });

  return team ? team.get({ plain: true }) : null;
};

const getWeekRange = (weeksAgo = 0) => {
  const target = subWeeks(new Date(), weeksAgo);
  const weekStart = startOfWeek(target, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(target, { weekStartsOn: 1 });
  return {
    weekStartISO: formatISO(weekStart, { representation: "date" }),
    weekEndISO: formatISO(weekEnd, { representation: "date" }),
  };
};

const normalizeDateRange = ({ fromDate, toDate }) => {
  const from = startOfDay(parseISO(fromDate));
  const to = endOfDay(parseISO(toDate));
  return {
    fromISO: formatISO(from, { representation: "date" }),
    toISO: formatISO(to, { representation: "date" }),
  };
};

export const getUserTimesheetsSummary = tool(
  async (input) => {
    const parsed = z
      .object({
        identifier: z.string().describe("User uuid OR name OR email"),
        weeksAgo: z.number().int().min(0).optional().default(0).describe("0=this week, 1=last week"),
        includeDescriptions: z.boolean().default(false),
      })
      .parse(input ?? {});

    const user = await resolveUserId(parsed.identifier);
    if (!user) return { error: "User not found", identifier: parsed.identifier };

    const { weekStartISO, weekEndISO } = getWeekRange(parsed.weeksAgo);

    //PER DAY TOTALS
    const [daily] = await db.query(
      `
      SELECT 
        DATE(t.date) AS day,
        SUM(t.hours) AS totalHours
      FROM timesheets t
      WHERE t.user_id = :userId
        AND t.date BETWEEN :weekStart AND :weekEnd
      GROUP BY DATE(t.date)
      ORDER BY DATE(t.date) ASC;
      `,
      {
        replacements: { userId: user.id, weekStart: weekStartISO, weekEnd: weekEndISO },
      }
    );

    //PER PROJECT AND TASK TOTALS
    const descSelect = parsed.includeDescriptions ? ", t.description AS description" : "";
    const [rows] = await db.query(
      `
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        ts.id AS task_id,
        ts.name AS task_name,
        DATE(t.date) AS day,
        SUM(t.hours) AS hours
        ${descSelect}
      FROM timesheets t
      JOIN projects p ON p.id = t.project_id
      JOIN tasks ts ON ts.id = t.task_id
      WHERE t.user_id = :userId
        AND t.date BETWEEN :weekStart AND :weekEnd
      GROUP BY p.id, p.name, ts.id, ts.name, DATE(t.date)
      ORDER BY p.name ASC, ts.name ASC, DATE(t.date) ASC;
      `,
      {
        replacements: { userId: user.id, weekStart: weekStartISO, weekEnd: weekEndISO },
      }
    );

    //OUTPUT STUCTURE
    const totals = daily.reduce((acc, r) => acc + Number(r.totalHours || 0), 0);

    const projectsMap = {};
    for (const r of rows) {
      const pid = r.project_id;
      const tid = r.task_id;

      if (!projectsMap[pid]) {
        projectsMap[pid] = {
          project_id: pid,
          project_name: r.project_name,
          total_hours: 0,
          tasks: {},
        };
      }
      if (!projectsMap[pid].tasks[tid]) {
        projectsMap[pid].tasks[tid] = {
          task_id: tid,
          task_name: r.task_name,
          total_hours: 0,
          daily: {},
        };
      }

      const h = Number(r.hours || 0);
      projectsMap[pid].total_hours += h;
      projectsMap[pid].tasks[tid].total_hours += h;
      projectsMap[pid].tasks[tid].daily[r.day] = h;
    }

    return {
      type: "user_week_summary",
      user,
      weeksAgo: parsed.weeksAgo,
      weekStart: weekStartISO,
      weekEnd: weekEndISO,
      totalHours: totals,
      dailyTotals: daily,
      projects: Object.values(projectsMap).map((p) => ({
        ...p,
        tasks: Object.values(p.tasks),
      })),
    };
  },
  {
    name: "get_user_timesheets_summary",
    description:
      "Get a user's weekly timesheet summary: total hours, per-day totals, and breakdown by project/task. Input identifier + weeksAgo.",
    schema: z
      .object({
        identifier: z.string(),
        weeksAgo: z.number().int().min(0).optional().default(0),
        includeDescriptions: z.boolean().optional(),
      })
      // .nullable()
      // .optional(),
  }
);
//GET TOTAL TEAM HOURS, HORUS PER MEMBER AND TOP TEAM PROJECTS
export const getTeamTimesheetsSummary = tool(
  async (input) => {
    const parsed = z
      .object({
        team: z.union([z.string(), z.number()]).describe("Team name or id"),
        weeksAgo: z.number().int().min(0).default(0),
      })
      .parse(input ?? {});

    const team = await resolveTeamWithUsers(parsed.team);
    if (!team) return { error: "Team not found", team: parsed.team };

    const userIds = (team.users ?? []).map((u) => u.id);
    if (userIds.length === 0) {
      return {
        type: "team_week_summary",
        team: { id: team.id, name: team.name },
        weeksAgo: parsed.weeksAgo,
        members: [],
        totalHours: 0,
        message: "Team has no users.",
      };
    }

    const { weekStartISO, weekEndISO } = getWeekRange(parsed.weeksAgo);

    //HOURS PER MEMBER
    const [members] = await db.query(
      `
      SELECT
        u.id AS user_id,
        u.uuid AS user_uuid,
        u.name AS user_name,
        u.email AS email,
        u.role AS role,
        SUM(t.hours) AS totalHours
      FROM timesheets t
      JOIN users u ON u.id = t.user_id
      WHERE t.user_id IN (:userIds)
        AND t.date BETWEEN :weekStart AND :weekEnd
      GROUP BY u.id, u.uuid, u.name, u.email, u.role
      ORDER BY totalHours DESC;
      `,
      {
        replacements: { userIds, weekStart: weekStartISO, weekEnd: weekEndISO },
      }
    );

    //TOP PROJECTS FOR TEAM
    const [projects] = await db.query(
      `
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        SUM(t.hours) AS totalHours
      FROM timesheets t
      JOIN projects p ON p.id = t.project_id
      WHERE t.user_id IN (:userIds)
        AND t.date BETWEEN :weekStart AND :weekEnd
      GROUP BY p.id, p.name
      ORDER BY totalHours DESC;
      `,
      {
        replacements: { userIds, weekStart: weekStartISO, weekEnd: weekEndISO },
      }
    );

    const totalHours = members.reduce((acc, m) => acc + Number(m.totalHours || 0), 0);

    return {
      type: "team_week_summary",
      team: { id: team.id, name: team.name },
      weeksAgo: parsed.weeksAgo,
      weekStart: weekStartISO,
      weekEnd: weekEndISO,
      totalHours,
      members,
      projects,
    };
  },
  {
    name: "get_team_timesheets_summary",
    description:
      "Get a team's weekly timesheet summary: total hours, hours per member, and top projects for that week. Input team + weeksAgo.",
    schema: z
      .object({
        team: z.union([z.string(), z.number()]),
        weeksAgo: z.number().int().min(0).optional().default(0),
      })
      .nullable()
      .optional(),
  }
);


//GET TOTAL HOURS OF PROJECT, PROJECT USERS, PROJECT TASKS
export const getProjectTimesheetsSummary = tool(
  async (input) => {
    const parsed = z
      .object({
        project: z.union([z.string(), z.number()]).describe("Project name or id"),
        fromDate: z.string().describe("YYYY-MM-DD"),
        toDate: z.string().describe("YYYY-MM-DD"),
        includeWeeklyBuckets: z.boolean().default(true),
      })
      .parse(input ?? {});

    const project = await resolveProject(parsed.project);
    if (!project) return { error: "Project not found", project: parsed.project };

    const { fromISO, toISO } = normalizeDateRange({ fromDate: parsed.fromDate, toDate: parsed.toDate });

    //USERS ON PROJECT
    const [users] = await db.query(
      `
      SELECT
        u.id AS user_id,
        u.uuid AS user_uuid,
        u.name AS user_name,
        u.email AS email,
        u.role AS role,
        SUM(t.hours) AS totalHours
      FROM timesheets t
      JOIN users u ON u.id = t.user_id
      WHERE t.project_id = :projectId
        AND t.date BETWEEN :fromDate AND :toDate
      GROUP BY u.id, u.uuid, u.name, u.email, u.role
      ORDER BY totalHours DESC;
      `,
      {
        replacements: { projectId: project.id, fromDate: fromISO, toDate: toISO },
      }
    );

    //TASKS ON PROJECT
    const [tasks] = await db.query(
      `
      SELECT
        ts.id AS task_id,
        ts.name AS task_name,
        SUM(t.hours) AS totalHours
      FROM timesheets t
      JOIN tasks ts ON ts.id = t.task_id
      WHERE t.project_id = :projectId
        AND t.date BETWEEN :fromDate AND :toDate
      GROUP BY ts.id, ts.name
      ORDER BY totalHours DESC;
      `,
      {
        replacements: { projectId: project.id, fromDate: fromISO, toDate: toISO },
      }
    );

    const totalHours =
      users.reduce((acc, u) => acc + Number(u.totalHours || 0), 0) ||
      tasks.reduce((acc, t) => acc + Number(t.totalHours || 0), 0);

    let weeklyBuckets = [];
    if (parsed.includeWeeklyBuckets) {
      const [weeks] = await db.query(
        `
        SELECT
          DATE(DATE_SUB(t.date, INTERVAL (WEEKDAY(t.date)) DAY)) AS weekStart,
          SUM(t.hours) AS totalHours
        FROM timesheets t
        WHERE t.project_id = :projectId
          AND t.date BETWEEN :fromDate AND :toDate
        GROUP BY weekStart
        ORDER BY weekStart ASC;
        `,
        {
          replacements: { projectId: project.id, fromDate: fromISO, toDate: toISO },
        }
      );
      weeklyBuckets = weeks;
    }

    return {
      type: "project_summary",
      project,
      fromDate: fromISO,
      toDate: toISO,
      totalHours,
      users,
      tasks,
      weeklyBuckets,
    };
  },
  {
    name: "get_project_timesheets_summary",
    description:
      "Get a project timesheet summary for a date range: total hours, top users, top tasks, and optional weekly buckets. Input project + fromDate/toDate.",
    schema: z
      .object({
        project: z.union([z.string(), z.number()]),
        fromDate: z.string(),
        toDate: z.string(),
        includeWeeklyBuckets: z.boolean().optional().default(true),
      })
      .nullable()
      .optional(),
  }
);
  

const tools = [
  getCurrentTime,
  getUserInfo,
  getWeekOverview,
  getAssignableProjectsOverview,
  getUserTimesheetsSummary,
  getTeamTimesheetsSummary,
  getProjectTimesheetsSummary,
];

const systemPrompt = 
"you are a helpful asistant for a project management / timesheet system"+
// "use the available tools when you need real data"+
"When the user asks about timesheets, prefer using tools to fetch real data (per user / per team / per project). " +
"Summarize first (totals, highlights) then provide breakdown. " +
"Be concise in your replies. If a tool returns JSON,  interpert it and explain it to the user in natural language."

const agent = createAgent({
    model: new ChatGroq({
      model: "llama-3.3-70b-versatile",
      // model: "llama-3.1-8b-instant",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
      maxRetries: 1,
    }),
    tools,
    systemPrompt,
});

export const assistantHandler = async (req, res) => {
    try {
      const { messages } = req.body;
  
      if (!Array.isArray(messages) || messages.length === 0) {
        return res
          .status(400)
          .json({ msg: "messages array is required and cannot be empty" });
      }
  
      const user = req.user || null;
  
      const response = await agent.invoke(
        { messages },
        // {
        //   context: {
        //     user_id: user?.id ?? null,
        //     username: user?.username ?? null,
        //   },
        //   configurable: {
        //     thread_id: user ? `user-${user.id}` : "anonymous",
        //   },
        // }
      );
      console.log(response);
    //   const reply =
    //     response?.content ??
    //     response?.output ??
    //     response?.text ??
    //     "No content returned from agent.";

    const agentMessages = response?.messages ?? [];

    // FIND LAST AI MESSAGE
    const lastAssistant = [...agentMessages].reverse().find(
      (m) => m instanceof AIMessage
    );

    const reply =
      (typeof lastAssistant?.content === "string"
        ? lastAssistant.content
        : null) || "No assistant message found.";

    return res.json({ reply });
  
    } catch (error) {
        console.error("agentAssistantHandler error", error);

        const code = error?.error?.error?.code;
        const status = error?.status;

        if(status===429 || code === "rate_limit_exceeded"){
            return res.status(429).json({
                msg:
                "The AI usage limit for today has been reached on the Groq account. " +
                "Try again later or use simpler/shorter questions for now.",
            });
        }




        return res.status(500).json({ msg: "internal server error" });
    }
  };
//////////MAGIC BUTTON LOGIC
export const magicButtonHandler = async(req,res)=>{
  try {
    const {project_id, task_id, hours, date} = req.body;

    if(!project_id || !task_id){
      return res.status(400).json({error: "project_id and task_id are required"});
    }

    const project = await Projects.findByPk(project_id, {
      attributes: ["id", "name", "description", "status", "due_date"],
      include: [
        {
          model: Customers,
          attributes: ["id", "name"],
          required: false,
        },
      ],
    });

    const task = await Tasks.findByPk(task_id, {
      attributes: ["id", "name", "description", "status", "due_date"],
    });

    if(!project) return res.status(404).json({error: "Project not found"});
    if(!task) return res.status(404).json({error:"Task not found"});

    const customerName = project.customer?.name ?  `Customer: ${project.customer.name}` : "";
    
    const prompt = `
      Generate a concise timesheet description (1–2 sentences) for the work performed.

      Rules:
      - Professional, neutral tone.
      - Focus on what was done (action + outcome).
      - Do NOT mention: hours, dates, IDs, customer names, or task/project status labels ("to do", "in progress", etc.).
      - No bullets, no markdown, no quotes.
      Return ONLY the description text.

      Context:
      Project: ${project.name}
      Project details: ${project.description ?? "N/A"}
      Task: ${task.name}
      Task details: ${task.description ?? "N/A"}
    `.trim();

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature:0.3,
      maxTokens: 120,
      maxRetries:3,
    });

    const aiRes = await model.invoke(prompt)
    // let description = (aiRes?.content ?? "").toString().trim();

    // description = description.replace(/^["']|["']$/g, "").trim();
    // if (description.length > 400) description = description.slice(0, 400).trim();

    // if (!description) {
    //   return res.status(502).json({ error: "AI did not return a description" });
    // }
    let description = (aiRes?.content ?? "").toString().trim();
    description = description.replace(/^["']|["']$/g, "").trim();

    if(!description) return res.status(502).json({error:"Empty AI Response"});


    return res.json({
      description,
    });

  } catch (error) {
    console.log("magicButtonHandler error:",error);
    return res.status(500).json({error:"Failed to generate description"})
  }
}
