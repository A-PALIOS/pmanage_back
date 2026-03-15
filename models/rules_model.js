import { Sequelize } from "sequelize";
import db from "../config/database.js";

const { DataTypes } = Sequelize;

const Rules = db.define('rules', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    time_limit_type: {
        type: DataTypes.ENUM('week', 'month'),
        allowNull: false,
        defaultValue: 'week'
    },
    time_limit_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    always_allow_current_week: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    manager_can_override: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    freezeTableName: true,
    timestamps: true
});

export default Rules;