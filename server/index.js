const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const connectDB = require('./db'); 

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

const port = 5000;
const app = express();

// Database connection call
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Register route
app.post("/registerUser", async (req, res) => {
  const { username, password, image } = req.body;
  try {
    const existingUser = await User.findOne({ userName: username });
    if (existingUser) {
      return res.json({ success: false, message: "Username already taken" });
    } 
    
    const newUser = new User({ 
      userName: username, 
      userPassword: password, 
      userImage: image || 'default.png' 
    });
    await newUser.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("Register Error: ", err);
    return res.json({ success: false, message: "Database error" });
  }
});

// Post route for user login
app.post("/getUserInfo", async (req, res) => {  
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ userName: username, userPassword: password });
    if (!user) {
      return res.send([]);
    }
    res.send([{ userId: user._id, userName: user.userName, userImage: user.userImage }]);
  } catch (err) {
    console.log("Error fetching user info: ", err);
    return res.status(500).send([]);
  }
});

// Fetching all posts from database
app.get('/getAllPosts', async (req, res) => {
  try {
    const posts = await Post.find().populate('postedUserId').sort({ postedTime: -1 });
    
    const formattedPosts = posts.map(post => ({
      postedUserName: post.postedUserId ? post.postedUserId.userName : "Unknown",
      postedUserImage: post.postedUserId ? post.postedUserId.userImage : "default.png",
      postId: post._id,
      postedUserId: post.postedUserId ? post.postedUserId._id : null,
      postedTime: post.postedTime,
      postText: post.postText,
      postImageUrl: post.postImageUrl
    }));
    
    res.send(formattedPosts);
  } catch (err) {
    console.log("Error loading all posts from the database: ", err);
    res.status(500).send([]);
  }
});

// Getting comments of a single post
app.get("/getAllComments/:postId", async (req, res) => {
    try {
        let id = req.params.postId;
        const comments = await Comment.find({ commentOfPostId: id }).populate('commentedUserId');
        
        const formattedComments = comments.map(comment => ({
            commentedUsername: comment.commentedUserId ? comment.commentedUserId.userName : "Unknown",
            commentedUserImage: comment.commentedUserId ? comment.commentedUserId.userImage : "default.png",
            commentId: comment._id,
            commentOfPostId: comment.commentOfPostId,
            commentedUserId: comment.commentedUserId ? comment.commentedUserId._id : null,
            commentText: comment.commentText,
            commentTime: comment.commentTime
        }));
        
        res.send(formattedComments);
    } catch (err) {
        console.log("error fetching comments from the database ", err);
        res.status(500).send([]);
    }
});

// Adding new comments to a post
app.post("/postComment" , async (req, res) => {
    const { commentOfPostId, commentedUserId, commentText, commentTime } = req.body;
    if (!commentText || commentText.trim() === "") {
        return res.status(400).json({ message: "Comment cannot be empty" });
    }

    try {
        const newComment = new Comment({
            commentOfPostId,
            commentedUserId,
            commentText,
            commentTime: commentTime || new Date()
        });
        const result = await newComment.save();
        res.send(result);
    } catch (err) {
        console.log("Error adding comment to the database: ", err);
        res.status(500).send("Database Error");
    }
}); 

// Adding new post
app.post('/addNewPost', async (req, res) => {
  const { postedUserId, postedTime, postText, postImageUrl } = req.body;
  if (!postText || postText.trim() === "") {
    return res.status(400).json({ message: "Post cannot be empty" });
  }

  try {
    const newPost = new Post({
        postedUserId,
        postedTime: postedTime || new Date(),
        postText,
        postImageUrl
    });
    const result = await newPost.save();
    res.send(result);
  } catch (err) {
    console.log("Error while adding a new post in the database: ", err);
    res.status(500).send("Database Error");
  }
});

// Post delete option
app.delete("/deletePost/:id/:userId", async (req, res) => {
    const { id, userId } = req.params;
    try {
        const result = await Post.deleteOne({ _id: id, postedUserId: userId });
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Post edit option
app.put("/editPost", async (req, res) => {
    const { postId, postText, postImageUrl, userId } = req.body;
    try {
        const result = await Post.updateOne(
            { _id: postId, postedUserId: userId },
            { $set: { postText, postImageUrl } }
        );
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Delete comment route
app.delete("/deleteComment/:commentId/:userId/:postOwnerId", async (req, res) => {
    const { commentId, userId, postOwnerId } = req.params;
    try {
        const comment = await Comment.findById(commentId).populate('commentOfPostId');
        
        if (!comment) {
            return res.status(404).send({ success: false, message: "Comment not found" });
        }

        const isCommenter = comment.commentedUserId.toString() === userId;
        const isPostOwner = comment.commentOfPostId && comment.commentOfPostId.postedUserId.toString() === userId;

        if (isCommenter || isPostOwner) {
            await Comment.findByIdAndDelete(commentId);
            return res.send({ success: true, message: "Comment deleted" });
        } else {
            return res.status(403).send({ success: false, message: "Unauthorized deletion" });
        }
    } catch (err) {
        return res.status(500).send(err);
    }
});

// Edit comment route
app.put("/editComment", async (req, res) => {
    const { commentId, commentText, userId } = req.body;
    try {
        const result = await Comment.updateOne(
            { _id: commentId, commentedUserId: userId },
            { $set: { commentText } }
        );
        res.send({ success: true, message: "Comment updated" });
    } catch (err) {
        return res.status(500).send(err);
    }
});

// Update profile image route
app.put("/updateProfileImage", async (req, res) => {
    const { userId, userImage } = req.body; 
    try {
        await User.updateOne({ _id: userId }, { $set: { userImage } });
        res.json({ success: true, message: "Profile image updated successfully" });
    } catch (err) {
        console.log("Error updating profile image: ", err);
        return res.json({ success: false, message: "Database error" });
    }
});

// Delete user account route
app.delete("/deleteUser/:userId", async (req, res) => {
    const userId = req.params.userId;
    try {
        await Comment.deleteMany({ commentedUserId: userId });
        await Post.deleteMany({ postedUserId: userId });
        await User.deleteOne({ _id: userId });

        res.json({ success: true, message: "User and all related data deleted" });
    } catch (err) {
        res.json({ success: false, message: "Error deleting user data" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});