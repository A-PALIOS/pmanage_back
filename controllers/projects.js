import Projects from "../models/project_model.js"; 
import Customers from "../models/customer_model.js";
import Tasks from "../models/task_model.js";
import Users from "../models/user_model.js";
import TeamMembers from "../models/teamMembers_model.js";
import ProjectTeams from "../models/projectTeams_model.js";

// GET ALL PROJECTS
export const getProjects = async (req, res) => {
    try {
        const projects = await Projects.findAll({
            include: [
                { model: Customers, attributes: ["id", "name", "email"] }, 
                // { model: Teams, attributes: ["id", "name"] }
            ]
        });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET PROJECT BY ID
export const getProjectById = async (req, res) => {
    try {
        const project = await Projects.findOne({
            where: { id: req.params.id },
            include: [
                { model: Customers, attributes: ["id", "name", "email"] }, 
            ]
        });

        if (!project) return res.status(404).json({ msg: "Project not found" });

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET ALL PROJECTS WITH THEIR TASKS
export const getProjectsWithTasks = async (req, res) => {
    try {
        const projects = await Projects.findAll({
            include: [
                {
                    model: Tasks,
                    attributes: ["id", "uuid", "name", "description", "status", "due_date","project_id"],
                }
            ]
        });

        res.status(200).json(projects);
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

export const getUserProjects = async (req, res) => {
    try {
        const { userUUId } = req.params;

        const userId = await getUserIdByUuid(userUUId);

        // GET TEAM ID FOR USER
        const userTeams = await TeamMembers.findAll({
            where: { userId: userId },
            attributes: ["team_id"]
        });

        const teamIds = userTeams.map(team => team.team_id);

        if (teamIds.length === 0) {
            return res.status(200).json([]);
        }

        // GET PROJECT ID FOR THE USER TEAMS
        const teamProjects = await ProjectTeams.findAll({
            where: { team_id: teamIds },
            attributes: ["project_id"]
        });

        const projectIds = teamProjects.map(project => project.project_id);

        if (projectIds.length === 0) {
            return res.status(200).json([]);
        }

        const projects = await Projects.findAll({
            where: { id: projectIds },
            include: [
                {
                    model: Tasks,
                    attributes: ["id", "uuid", "name", "description", "status", "due_date","project_id"],
                }
            ]
        });

        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching user projects:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

/////
// export const getUserProjects = async (req, res) => {
//     try {
//         const { userId } = req.params;

//         const projects = await Projects.findAll({
//             include: [
//                 {
//                     model: Teams,
//                     through: ProjectTeams,
//                     include: [
//                         {
//                             model: Users,
//                             through: TeamMembers,
//                             where: { id: userId }, // Filter teams by user ID
//                         },
//                     ],
//                 },
//             ],
//         });

//         res.status(200).json(projects);
//     } catch (error) {
//         console.error("Error fetching user projects:", error);
//         res.status(500).json({ msg: "Server error" });
//     }
// };
/////


// CREATE A PROJECT
export const createProject = async (req, res) => {
    const { name, description, due_date, status, signed_date, customer_id } = req.body;
    try {
        const project = await Projects.create({
            name:name,
            description:description,
            due_date:due_date,
            status:status,
            signed_date:signed_date,
            customer_id:customer_id
        });

        res.status(201).json({ msg: "Project created successfully", project });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// UPDATE A PROJECT
export const updateProject = async (req, res) => {
    try {
        const [rowsUpdated] = await Projects.update(req.body, {
            where: { id: req.params.id }
        });

        if (rowsUpdated === 0) return res.status(404).json({ msg: "Project not found" });

        res.status(200).json({ msg: "Project updated successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// DELETE A PROJECT
export const deleteProject = async (req, res) => {
    try {
        const rowsDeleted = await Projects.destroy({
            where: { id: req.params.id }
        });

        if (rowsDeleted === 0) return res.status(404).json({ msg: "Project not found" });

        res.status(200).json({ msg: "Project deleted successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
