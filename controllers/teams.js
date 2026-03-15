import Teams from "../models/teams_model.js";
import Users from "../models/user_model.js";
import { Op } from "sequelize";

// GET ALL TEAMS
export const getTeams = async (req, res) => {
    try {
        const response = await Teams.findAll({
            attributes: ["id","uuid", "name"],
            include: [
                { model: Users, as: "manager", attributes: ["uuid", "name", "email"] },
                { model: Users, through: { attributes: [] }, attributes: ["uuid", "name", "email"] }
            ]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};


// GET TEAM BY ID
export const getTeamById = async (req, res) => {
    try {
        const response = await Teams.findOne({
            where: { id: req.params.id },
            attributes: ["id","uuid", "name"],
            include: [
                { model: Users, as: "manager", attributes: ["uuid", "name", "email"] },
                { model: Users, through: { attributes: [] }, attributes: ["uuid", "name", "email"] }
            ]
        });

        if (!response) return res.status(404).json({ msg: "Team not found" });
        res.status(200).json(response);
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

// GET TEAM BY MANAGERID
export const getTeamMembersByManagerUUId = async (req, res) => {
    try {
        const managerId = await getUserIdByUuid(req.params.managerId);
        console.log(managerId)
        const response = await Teams.findAll({
            where: { manager_id: managerId},
            attributes: ["id","uuid", "name"],
            include: [
                { 
                    model: Users, through: { attributes: [] },
                    attributes: ["uuid", "name", "email","role"], 
                }
            ]
        });

        if (!response || response.length === 0) return res.status(404).json({ msg: "Teams not found for manager" });
        
        //FLATEN THE ARRAY TO DEPTH 1 SO I HAVE([{uuid:...,name:...,email:...,role:...},{},{},....])
        const members = response.flatMap(team => team.users);

        //REMOVE DUPLICATE MEMBERS FOUND IN MULTIPLE DIFFERENT TEAMS
        const uniqueMembers = Array.from(
            new Map( members.map(user=> [user.uuid,user] ) ).values()
        )

        res.status(200).json(uniqueMembers);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// CREATE A TEAM
export const createTeam = async (req, res) => {
    const { name, manager_id, user_ids } = req.body;

    try {
        const manager = await Users.findOne({ where: { uuid: manager_id } });
        if (!manager) return res.status(404).json({ msg: "Manager not found" });

        const team = await Teams.create({ name, manager_id: manager.id });

        if (user_ids && user_ids.length > 0) {
            const users = await Users.findAll({ where: { uuid: { [Op.in]: user_ids } } });
            await team.addUsers(users);
        }
        const users = await Users.findAll({ where: { uuid: { [Op.in]: user_ids } } });

        res.status(201).json({ msg: "Team created successfully",users });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// UPDATE TEAM
export const updateTeam = async (req, res) => {
    const team = await Teams.findOne({ where: { id: req.params.id } });

    if (!team) return res.status(404).json({ msg: "Team not found" });

    const { name, manager_id, user_ids } = req.body;

    try {

        let managerIdToSave = team.manager_id; 

        if (manager_id) {
            const newManager = await Users.findOne({ where: { uuid: manager_id } });

            if (!newManager) {
                return res.status(404).json({ msg: "New manager not found" });
            }

            if (newManager.id !== team.manager_id) {
                managerIdToSave = newManager.id; 
            }
        }

        await team.update({ name, manager_id: managerIdToSave });

        if (user_ids) {
            const users = await Users.findAll({ where: { uuid: { [Op.in]: user_ids } } });
            await team.setUsers(users); 
        }

        res.status(200).json({ msg: "Team updated successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// DELETE TEAM
export const deleteTeam = async (req, res) => {
    const team = await Teams.findOne({ where: { id: req.params.id } });

    if (!team) return res.status(404).json({ msg: "Team not found" });

    try {
        await team.destroy();
        res.status(200).json({ msg: "Team deleted successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
