import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Users from "./user_model.js";

const { DataTypes } = Sequelize;

const Teams = db.define("teams", {
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
    }
}, { freezeTableName: true });

// Associations
Teams.belongsTo(Users, { as: "manager", foreignKey: "manager_id"});
Teams.belongsToMany(Users, { through: "teammembers", foreignKey: "team_id",onDelete: "CASCADE" });

export default Teams;
