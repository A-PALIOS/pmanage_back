import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import db from "./config/database.js"
import SequelizeStore from "connect-session-sequelize"
import session from "express-session";
import cors from "cors"
// var express = require("express");
// var bodyParser = require("body-parser");
import testRouter from "./routes/test_route.js";
import userRouter from "./routes/user_route.js";
import authRouter from "./routes/auth_route.js";
import customerRouter from "./routes/customer_route.js"
import projectRouter from "./routes/project_route.js"
import taskRouter from "./routes/task_route.js"
import teamRouter from "./routes/team_route.js"
import project_teamsRouter from "./routes/project_teams_route.js"
import timesheetRouter from "./routes/timesheet_route.js"
import rulesRouter from "./routes/rules_route.js"
import assistantRouter from "./routes/assistant_route.js"

import Users from "./models/user_model.js";
import Teams from "./models/teams_model.js";
import Customers from "./models/customer_model.js";
import Projects from "./models/project_model.js";
import Tasks from "./models/task_model.js";
import Timesheets from "./models/timesheet_model.js";
import TeamMembers from "./models/teamMembers_model.js";
import ProjectTeams from "./models/projectTeams_model.js";
import Rules from "./models/rules_model.js";
dotenv.config()

const app = express();

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));


const sessionStore=SequelizeStore(session.Store);
const store = new sessionStore({
    db:db
});

(async()=>{
    //await db.sync();
    await Users.sequelize.sync();  
    await Teams.sequelize.sync();
    await Customers.sequelize.sync();
    await Projects.sequelize.sync();
    await Tasks.sequelize.sync();
    await Timesheets.sequelize.sync();
    await TeamMembers.sequelize.sync();
    await ProjectTeams.sequelize.sync();
    await Rules.sequelize.sync();
})();



app.use(session({
    secret:process.env.SESS_SECRET,
    resave:false,
    saveUninitialized:false,
    store:store,
    cookie:{
        secure:false,
        httpOnly:true,
        sameSite:"lax",
        maxAge: 24 * 60 * 60 * 1000,
    }
}))

app.use(cors({
    credentials:true,
    origin:'http://localhost:3000',
    // origin:"http://192.168.1.150:3000"
    
})); 

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    //res.header('Access-Control-Allow-Origin', 'http://192.168.1.150:3000')
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


app.use(express.json());
app.use(testRouter);
app.use(userRouter);
app.use(authRouter);
app.use(customerRouter);
app.use(projectRouter);
app.use(taskRouter);
app.use(teamRouter);
app.use(project_teamsRouter);
app.use(timesheetRouter);
app.use(rulesRouter);
app.use(assistantRouter);



// var routes = require("./routes/routes.js")(app);

// var server = app.listen(process.env.APP_PORT,"192.168.1.150", function () {
//     console.log("Listening on port %s...", server.address().port);
// });   

var server = app.listen(process.env.APP_PORT, function () {
    console.log("Listening on port %s...", server.address().port);
});   

// app.listen(process.env.APP_PORT,()=>{
//     console.log("Listening on port %s...", server.address().port);
// });