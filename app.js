// app.js
require("dotenv").config(); // <-- add this at the very top of app.js

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");

// Models
const Listing = require("./models/listing.js");
const Booking = require("./models/booking.js");

// MongoDB Connection
const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";
async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => console.log("✅ Database Connected"))
  .catch((err) => console.log("❌ DB Error", err));

// Middleware & Config
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Session Middleware (must be before passport + routes)
app.use(
  session({
    secret: "karan@2082", // ⚠️ change to env var in production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URL }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Passport Config (Google Sign-In)
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// ✅ Make username available in all templates
app.use((req, res, next) => {
  res.locals.username =
    req.session?.username || (req.user ? req.user.username : null);
  next();
});

// ---------------- ROUTES ----------------

// Home
app.get("/", (req, res) => {
  res.redirect("/home");
});
app.get("/home", (req, res) => {
  res.render("Listings/home.ejs");
});

// Listings CRUD
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("Listings/index.ejs", { allListings });
});

app.get("/listings/new", (req, res) => {
  res.render("Listings/new.ejs");
});

app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("Listings/show.ejs", { listing });
});

app.post("/listings", async (req, res, next) => {
  try {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
});

app.get("/listings/:id/edit", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("Listings/edit.ejs", { listing });
});

app.put("/listings/:id", async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, req.body.listing);
  res.redirect("/listings");
});

app.delete("/listings/:id", async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

// Booking Routes
app.get("/listings/:id/book", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("Listings/book.ejs", { listing });
});

app.get("/booking", async (req, res) => {
  try {
    const allBooking = await Booking.find();
    res.render("Listings/showBooking.ejs", { allBooking });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/booking", async (req, res) => {
  try {
    const { hotelTitle, name, email, phoneNumber, date, startTime, endTime } =
      req.body;
    const newBooking = new Booking({
      hotelTitle,
      name,
      email,
      phoneNumber,
      date,
      startTime,
      endTime,
    });
    await newBooking.save();
    res.redirect("/booking");
  } catch (err) {
    console.error(err);
    res.send("Error creating booking");
  }
});

// Auth Routes (Signup/Login + Google OAuth)
const authRoutes = require("./routes/auth.js");
app.use("/", authRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.log(err);
  res.send("Something went wrong");
});

// Start Server
app.listen(8080, () => {
  console.log("🚀 Listening on port 8080");
});
