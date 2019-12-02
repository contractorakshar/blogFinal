const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const multer = require('multer');

// Custom module
const urls = require('./config/myUrl');

// Import routes
const homeRoute = require('./routes/homeRoute');
const authRoute = require('./routes/authRoute');
const postsRoute = require('./routes/postsRoute');

// Initialize express app
const app = express();

// Database Connection
mongoose.connect(urls.mongoDB, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('MongoDB is successfully connected'))
    .catch(err => console.log(err))

// Configuration for form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Multer file upload Configuration
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, path.join(__dirname, 'public/images'))
    },
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  });
const upload = multer({ 
    storage: storage 
}).single('image');

app.use((req, res, next) => {
    upload(req, res, err => {
        if(req.file) {
            req.image = req.file.filename;
        }
        next();
    })
})

// Static file path setup
app.use('/static', express.static(path.join(__dirname, 'public')));
// Setup for template Engine
app.set('views', './views');
app.set('view engine', 'ejs');

// Session store configuration
const store = new MongoDBStore({
    uri: urls.mongoDB,
    databaseName: 'coreblog',
    collection: 'session'
})

// Session configuration
app.use(session({
    secret: 'my secret key',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(flash());

// Set isAuthenticate to all routes
app.use((req, res, next) => {
    if(req.session.isLoggedIn) {
        res.locals.isAuthenticate = true;
        res.locals.authUser = req.session.user;
    } else {
        res.locals.isAuthenticate = false;
        res.locals.authUser = 0;
    }
    next();
});

// Configure routes in middleware
app.use('/', homeRoute);
app.use('/auth', authRoute);
app.use('/posts', postsRoute);

app.listen(8080, () => console.log('Server is running on port 8080'));
