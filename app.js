const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const multer = require("multer");
const fetch = require("node-fetch");
// Custom module
const urls = require("./config/myUrl");

// Import routes
const homeRoute = require("./routes/homeRoute");
const authRoute = require("./routes/authRoute");
const postsRoute = require("./routes/postsRoute");
const { compare } = require("bcryptjs");
// const Admin = require("./routes/AdminRoutes");
// Initialize express app
const app = express();
app.get("/", (req, res) => {
  let a = "happy";
  // console.log("hello");
  // res.send('Hello world');
  fetch("https://aplet123-wordnet-search-v1.p.rapidapi.com/master?word=" + a, {
    method: "GET",
    headers: {
      "x-rapidapi-key": "d00d745d82msh49a483b75ee89fdp14464ajsneb0658917638",
      "x-rapidapi-host": "aplet123-wordnet-search-v1.p.rapidapi.com",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      let d = JSON.stringify(data.definition);
      //   console.log(d.split(";"));
      let arr = d.split(";");
      // res.send(arr[0]);
      console.log(arr[0]);
    })
    .catch((err) => {
      console.error(err);
    });
});
// Database Connection
mongoose
  .connect(urls.mongoDB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: true,
  })
  .then(() => console.log("MongoDB is successfully connected"))
  .catch((err) => console.log(err));

// Configuration for form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Multer file upload Configuration
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/images"));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
}).single("image");

app.use((req, res, next) => {
  upload(req, res, (err) => {
    if (req.file) {
      req.image = req.file.filename;
    }
    next();
  });
});

// Static file path setup
app.use("/static", express.static(path.join(__dirname, "public")));
// Setup for template Engine
app.set("views", "./views");
app.set("view engine", "ejs");

// Session store configuration
const store = new MongoDBStore({
  uri: urls.mongoDB,
  databaseName: "blogTrial",
  collection: "session",
});

// Session configuration
app.use(
  session({
    secret: "my secret key",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(flash());

// Set isAuthenticate to all routes
app.use((req, res, next) => {
  if (req.session.isLoggedIn) {
    res.locals.isAuthenticate = true;
    res.locals.authUser = req.session.user;
    // console.log(req.session.user);
    // console.log(req.locals.authUser);
  } else {
    res.locals.isAuthenticate = false;
    res.locals.authUser = 0;
  }
  next();
});

// Configure routes in middleware
app.use("/", homeRoute);
// app.use("/AdminRoutes", Admin);
app.use("/auth", authRoute);
app.use("/posts", postsRoute);

app.listen(3001, () => console.log("Server is running on port 3001"));
