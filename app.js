const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const passport = require('passport');
const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// GET route to show all posts
app.get('/posts', async (req, res) => {
    const posts = await prisma.post.findMany({
        include: { comments: true }, // Include comments if needed
    });

    res.render('posts', { posts });
});

// GET route to show the new post form
app.get('/newpost', (req, res) => {
    res.render('newpostpage');
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
