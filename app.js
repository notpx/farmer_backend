const express = require('express');
var bcrypt = require('bcryptjs');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql2/promise');

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.use(session({
secret: 'your_secret_key',
resave: false,
saveUninitialized: true,
cookie: { secure: false } // Make sure this is false for development
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}


passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // Passwords do not match!
        return done(null, false, { message: "Incorrect password" });
      }

      // If everything is good, return the user
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
        return next(err);
        }
        res.redirect("/");
        });
    });

app.post(
    "/log-in",
    passport.authenticate("local", {
successRedirect: "/posts",
failureRedirect: "/"
})
    );

app.get("/", (req, res) => {
    res.render("index", { user: req.user });
    });


passport.serializeUser((user, done) => {
    done(null, user.id);
    });

passport.deserializeUser(async (id, done) => {
    try {
    const [ rows ] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const user = rows[0];

    done(null, user);
    } catch(err) {
    done(err);
    }
    });







app.get('/posts',  async (req, res) => {
    try {
    const posts = await prisma.post.findMany({
include: { comments: true }, // Include comments if needed
});
    res.render('posts', { posts });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posts' });
    }
    });// GET route to show the new post form

app.get('/newpost', isAuthenticated,  (req, res) => {
    res.render('newpostpage');
    });


//// app.js

app.get("/signup", (req, res) => res.render("signup"));

const pool = mysql.createPool({
host: "localhost",          // e.g., "localhost" or your database server address
port: 3306,                 // default MySQL port
database: "auth",  // name of your database
user: "root",      // your database user
password:"root" ,  // your database user's password
});


app.post("/signup", async (req, res, next) => {
    try {
    const hero = await bcrypt.hash(req.body.password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", [
        req.body.username,
        hero,
    ]);
    res.redirect("/");
    } catch(err) { return next(err); }
    });








// POST route to create a new post
app.post('/newpost', async (req, res) => {
    const { title, content } = req.body;

    const newPost = await prisma.post.create({
data: {
title,
content,
},
});

    res.redirect(`/posts/${newPost.id}`);
    });

// GET route to display a single post and its comments
app.get('/posts/:id', async (req, res) => {
    const postId = parseInt(req.params.id);

    const post = await prisma.post.findUnique({
where: { id: postId },
include: { comments: true }, // Include comments
});

    if (!post) {
    return res.status(404).send('Post not found');
    }

    res.render('postpage', { post });
    });

// POST route to add a comment to a post
app.post('/posts/:id/comments', async (req, res) => {
    const { content } = req.body;
    const postId = parseInt(req.params.id, 10);

    await prisma.comment.create({
data: {
content,
postId,
},
});

    res.redirect(`/posts/${postId}`); // Redirect to the post page
    });

// Start the server/////////

//////////////




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    });
