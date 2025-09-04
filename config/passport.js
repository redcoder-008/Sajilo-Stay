const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User.js"); // adjust path if needed
require("dotenv").config(); // make sure you have .env file with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

// =======================
// GOOGLE STRATEGY
// =======================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1️⃣ Find user by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // 2️⃣ If googleId not found, check by email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // If email exists, link Google account
            user.googleId = profile.id;
            await user.save();
          } else {
            // 3️⃣ Else create new user
            user = new User({
              username: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
            });
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// =======================
// SERIALIZE / DESERIALIZE
// =======================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
