import Tasks from "../models/task_model.js";
import Projects from "../models/project_model.js";

// GET ALL TASKS
export const getTasks = async (req, res) => {
    try {
        const response = await Tasks.findAll({
            attributes: ["id","uuid", "name", "description", "status", "due_date", "project_id"],
            include: [{ model: Projects, attributes: ["name"] }]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET A SINGLE TASK BY ID
export const getTaskById = async (req, res) => {
    try {
        const response = await Tasks.findOne({
            attributes: ["id","uuid", "name", "description", "status", "due_date", "project_id"],
            where: { id: req.params.id },
            include: [{ model: Projects, attributes: ["name"] }]
        });
        if (!response) return res.status(404).json({ msg: "Task not found" });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET TASKS BY PROJECT ID
export const getTasksByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await Tasks.findAll({
            attributes: ["id", "uuid", "name", "description", "status", "due_date", "project_id"],
            where: { project_id: projectId },
            include: [{ model: Projects, attributes: ["name"] }]
        });

        if (!tasks || tasks.length === 0) return res.status(404).json({ msg: "No tasks found for this project" });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// CREATE A TASK
export const createTask = async (req, res) => {
    const { name, description, status, due_date, project_id } = req.body;
    try {

        const project = await Projects.findByPk(project_id);
        if (!project) return res.status(404).json({ msg: "Project not found" });

        await Tasks.create({
            name:name,
            description:description,
            status:status,
            due_date:due_date,
            project_id:project_id
        });

        res.status(201).json({ msg: "Task created successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// UPDATE A TASK
export const updateTask = async (req, res) => {
    console.log("Received Data:", req.body);
    try {
        const task = await Tasks.findOne({ where: { id: req.params.id } });
        if (!task) return res.status(404).json({ msg: "Task not found" });

        const { name, description, status, due_date, project_id } = req.body;

        if (project_id) {
            const project = await Projects.findByPk(project_id);
            if (!project) return res.status(404).json({ msg: "Project not found" });
        }

        await task.update({
            name:name,
            description:description,
            status:status,
            due_date:due_date,
            project_id:project_id
        });

        res.status(200).json({ msg: "Task updated successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// DELETE A TASK
export const deleteTask = async (req, res) => {
    try {
        const task = await Tasks.findOne({ where: { id: req.params.id } });
        if (!task) return res.status(404).json({ msg: "Task not found" });

        await task.destroy();
        res.status(200).json({ msg: "Task deleted successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
