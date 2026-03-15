import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Teams from "./teams_model.js";
import Users from "./user_model.js";

const { DataTypes } = Sequelize;


const TeamMembers  = db.define("teammembers",{
    team_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Teams,
            key: "id",
        },
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: Users,
            key: "id",
        },
    },
    
        
    },
);

export default TeamMembers ;