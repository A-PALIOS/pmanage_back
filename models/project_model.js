import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Customers from "./customer_model.js";
import Teams from "./teams_model.js";

const { DataTypes } = Sequelize;

const Projects = db.define("projects", {
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
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    signed_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("in talks", "in progress", "complete", "delivered"),
        allowNull: false,
        defaultValue: "in talks"
    },
    // customer_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     references: {
    //         model: Customers,
    //         key: "id"
    //     },
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // }
}, { freezeTableName: true });

// Associations
Projects.belongsTo(Customers, { foreignKey: "customer_id",onDelete: "CASCADE"  });
Customers.hasMany(Projects, { foreignKey: "customer_id" });
Projects.belongsToMany(Teams, { through: "projectteams", foreignKey: "project_id",onDelete: "CASCADE" });
Teams.belongsToMany(Projects, { through: "projectteams", foreignKey: "team_id", onDelete: "CASCADE" });

export default Projects;
