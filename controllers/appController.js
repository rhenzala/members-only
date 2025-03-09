require("dotenv").config();
const pool = require("../db/pool");
const passport = require("../config/auth");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");


exports.postLogIn = passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  })

exports.getHome = async (req, res) => {
    try {
      const { rows: messages } = await pool.query(`
        SELECT messages.id, messages.title, messages.text, messages.created_at, 
               users.first_name || ' ' || users.last_name AS author
        FROM messages
        JOIN users ON messages.user_id = users.id
        ORDER BY messages.created_at DESC
      `);
  
      res.render("index", { user: req.user, messages }); 
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).send("Error loading messages");
    }
}

exports.postMessages = async (req, res) => {
    if (!req.user) {
      return res.status(401).send("You must be logged in to post a message.");
    }
  
    const { title, text } = req.body;
    try {
      await pool.query(
        "INSERT INTO messages (title, text, user_id) VALUES ($1, $2, $3)",
        [title, text, req.user.id]
      );
      res.redirect("/");
    } catch (err) {
      console.error("Error posting message:", err);
      res.status(500).send("Error posting message");
    }
}

exports.getJoinClub = (req, res) => res.render("join-club")
exports.postJoinClub = async (req, res) => {
    const passcode = req.body.passcode;
    if (passcode === process.env.SECRET_KEY) {
        await pool.query("UPDATE users SET membership = TRUE WHERE id = $1", [req.user.id]);
        res.redirect("/");
    } else {
        res.render("join-club", { user: req.user, error: "Incorrect passcode." });
    }
}

exports.getSignUp = (req, res) => res.render("signup")
exports.postSignUp = async (req, res, next) => {
    try {
     const hashedPassword = await bcrypt.hash(req.body.password, 10);
     await pool.query("insert into users (first_name, last_name, email, password) values ($1, $2, $3, $4)", [req.body.firstname, req.body.lastname, req.body.username, hashedPassword]);
     res.redirect("/");
    } catch (error) {
       console.error(error);
       next(error);
    }
}

exports.getLogOut = (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
}

