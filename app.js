const path = require("node:path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const appRouter = require("./routes/appRouter");
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use("/", appRouter);


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});



 






