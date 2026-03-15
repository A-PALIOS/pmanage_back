import Projects from "../models/project_model.js";
import Teams from "../models/teams_model.js";
import Users from "../models/user_model.js";
import TeamMembers from "../models/teamMembers_model.js";
import ProjectTeams from "../models/projectTeams_model.js";
import { Op } from "sequelize";

// GET ALL TEAMS FOR A PROJECT
export const getTeamsForProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Projects.findByPk(projectId, {
            include: { model: Teams, through: { attributes: [] } }
        });

        if (!project) return res.status(404).json({ msg: "Project not found" });

        res.status(200).json(project.teams);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET ALL PROJECTS FOR A TEAM
export const getProjectsForTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await Teams.findByPk(teamId, {
            include:[ 
                { model: Projects, through: { attributes: [] }, },
                { model: Users, as: "manager", attributes: ["uuid", "name", "email"] }, // Manager Info
                { model: Users, through: { attributes: [] }, attributes: ["uuid", "name", "email"] } // Team Members
            ]
        });

        if (!team) return res.status(404).json({ msg: "Team not found" });

        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// ASSIGN A TEAM TO A PROJECT
export const assignTeamToProject = async (req, res) => {
    try {
        const { projectId, teamId } = req.body;

        const project = await Projects.findByPk(projectId);
        const team = await Teams.findByPk(teamId);

        if (!project || !team) return res.status(404).json({ msg: "Project or Team not found" });

        await project.addTeam(team);//AUTO GENERATED SEQUELIZE FUNCTION

        res.status(201).json({ msg: "Team assigned to project successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// REMOVE A TEAM FROM A PROJECT
export const removeTeamFromProject = async (req, res) => {
    try {
        const { projectId, teamId } = req.params;

        const project = await Projects.findByPk(projectId);
        const team = await Teams.findByPk(teamId);

        if (!project || !team) return res.status(404).json({ msg: "Project or Team not found" });

        await project.removeTeam(team);

        res.status(200).json({ msg: "Team removed from project successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
/////
const getUserIdByUuid = async (uuid) => {
    const user = await Users.findOne({
        where: { uuid },
        attributes: ["id"],
    });
    return user ? user.id : null;
};
/////
export const getUserProjects = async (req, res) => {
    try {
        const { uuid } = req.params;

        const userId = await getUserIdByUuid(uuid);
        if (!userId) {
            return res.status(400).json({ error: "Missing required parameters: uuid." });
        }

        const teams = await TeamMembers.findAll({
            where: { userId: userId },
            attributes: ["team_id"]
        });

        if (teams.length === 0) {
            //return res.status(404).json({ message: "No teams found for this user",teams });
            return res.json({ allowedProjects: [] });
        }

        const teamIds = teams.map(team => team.team_id);

        const projectTeams = await ProjectTeams.findAll({
            where: { team_id: { [Op.in]: teamIds } },
            attributes: ["project_id"]
        });

        if (projectTeams.length === 0) {
            //return res.status(404).json({ message: "No projects found for this user" });
            return res.json({ allowedProjects: [] });
        }

        const projectIds = projectTeams.map(pt => pt.project_id);

        const projects = await Projects.findAll({
            where: { id: { [Op.in]: projectIds } }
        });

        res.json({ allowedProjects: projects });
    } catch (error) {
        console.error("Error fetching user projects:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

