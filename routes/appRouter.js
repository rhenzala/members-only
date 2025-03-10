const { Router } = require("express");
const appRouter = Router();
const appController = require("../controllers/appController");


appRouter.get("/", appController.getHome);
appRouter.post("/messages", appController.postMessages);

appRouter.get("/sign-up", appController.getSignUp);
appRouter.get("/log-out", appController.getLogOut);

appRouter.post("/sign-up", appController.postSignUp);

appRouter.post("/log-in", appController.postLogIn);
appRouter.get("/join-club", appController.getJoinClub);
appRouter.post("/join-club", appController.postJoinClub);
appRouter.get("/log-in", appController.getLogIn);
appRouter.get("/admin", appController.getAdmin);
appRouter.post("/admin", appController.postAdmin);
appRouter.post("/delete/:id", appController.postDelete);

module.exports = appRouter