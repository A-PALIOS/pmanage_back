import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Projects from "./project_model.js";

const { DataTypes } = Sequelize;

const Tasks = db.define("tasks", {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("to do", "in progress", "done"),
        allowNull: false,
        defaultValue: "to do"
    },
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    // project_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     references: {
    //         model: Projects,
    //         key: "id"
    //     },
    //     onDelete: "CASCADE", 
    //     onUpdate: "CASCADE"
    // }
}, { freezeTableName: true });

// Associations
Tasks.belongsTo(Projects, { foreignKey: "project_id",onDelete: "CASCADE" });
Projects.hasMany(Tasks, { foreignKey: "project_id", onDelete: "CASCADE" });

export default Tasks;
