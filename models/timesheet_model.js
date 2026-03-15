import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Users from "./user_model.js";
import Projects from "./project_model.js";
import Tasks from "./task_model.js";

const { DataTypes } = Sequelize;

const Timesheets = db.define("timesheets", {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hours: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    description: {
        type: DataTypes.TEXT,     
        allowNull: true      
    }
}, { freezeTableName: true });

// Associations
Timesheets.belongsTo(Users, { foreignKey: {name:"user_id",allowNull: false},onDelete: "CASCADE" });
Timesheets.belongsTo(Projects, { foreignKey: {name:"project_id",allowNull: false},onDelete: "CASCADE" });
Timesheets.belongsTo(Tasks, { foreignKey: {name:"task_id",allowNull: false},onDelete: "CASCADE" });

export default Timesheets;
