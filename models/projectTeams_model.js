import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Projects from "./project_model.js";
import Teams from "./teams_model.js";

const { DataTypes } = Sequelize;


const ProjectTeams = db.define("projectteams",{
        project_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Projects,
                key: "id",
            },
        },
        team_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Teams,
                key: "id",
            },
        },
        
    },
);

export default ProjectTeams;