// routes/auth.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User.js");

// ---------------- SIGNUP ----------------
// GET signup page
router.get("/signup", (req, res) => {
  res.render("Listings/signup.ejs");
});

// POST signup
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

// ---------------- LOGIN ----------------
// GET login page
router.get("/login", (req, res) => {
  res.render("Listings/login.ejs");
});

// POST login (plain email/password)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password }); // plaintext match
    if (user) {
      req.session.userId = user._id;
      req.session.username = user.username;
      res.redirect("/home");
    } else {
      // res.send("Invalid credentials");
      res.render("Listings/wrong.ejs");
    }
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

// ---------------- LOGOUT ----------------
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ---------------- GOOGLE OAUTH ----------------
// Step 1: Redirect user to Google for login
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Google callback URL
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Successful login, store username in session
    req.session.username = req.user.username || req.user.displayName;
    res.redirect("/home");
  }
);

module.exports = router;
