require("dotenv").config();
const pool = require("../db/pool");
const passport = require("../config/auth");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const alphaErr = "must only contain letters.";
const lengthErr = "must be at least 1 character.";

// Sanitize user input when signing up
const validateUser = [
  body("firstname").trim()
    .isAlpha().withMessage(`First name ${alphaErr}`)
    .isLength({ min: 1}).withMessage(`First name ${lengthErr}`),
  body("lastname").trim()
    .isAlpha().withMessage(`Last name ${alphaErr}`)
    .isLength({ min: 1}).withMessage(`Last name ${lengthErr}`),
    body("username").trim()
    .isEmail().withMessage(`Invalid Email format.`)
    .normalizeEmail(),
    body("password")
        .trim() 
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/\d/).withMessage("Password must contain at least one number")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
        .matches(/[@$!%*?&\-.]/).withMessage("Password must contain at least one special character (@, $, !, %, *, ?, &, -, .)")
        .escape(), 

    body("confirmPassword")
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match");
            }
            return true;
        })
];


exports.getHome = async (req, res) => {
    try {
      const { rows: messages } = await pool.query(`
        SELECT messages.id, messages.title, messages.text, 
        TO_CHAR(messages.created_at, 'DD/MM/YYYY') AS created_at,  
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

exports.getLogIn = (req, res) => res.render("login");

exports.postLogIn = passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  })

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
exports.getAdmin = (req, res) => res.render("admin")
exports.postAdmin = async (req, res) => {
    const adminKey = req.body.adminKey;
    if (adminKey === process.env.ADMIN_KEY) {
        await pool.query("UPDATE users SET is_admin = TRUE WHERE id = $1", [req.user.id]);
        res.redirect("/");
    } else {
        res.render("admin", { user: req.user, error: "Incorrect key." });
    }
}

exports.getSignUp = (req, res) => {
    res.render("signup");
};

// Validate the user input before submitting
exports.postSignUp = [
    validateUser,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("signup", {
                errors: errors.array().map(err => err.msg), 
                oldInput: req.body 
            });
        }
        try {
         const hashedPassword = await bcrypt.hash(req.body.password, 10);
         await pool.query("insert into users (first_name, last_name, email, password) values ($1, $2, $3, $4)", [req.body.firstname, req.body.lastname, req.body.username, hashedPassword]); 
         res.redirect("/");
        } catch (error) {
           console.error(error);
           next(error);
        }
    }
]

exports.getLogOut = (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
}

