# PostBook - Full Stack Social Media Web App

PostBook is a full stack social media web application where users can register, login, create posts, comment on posts, edit/delete content, and manage their profile. It is built using Node.js, Express, MongoDB for backend and HTML, CSS, JavaScript for frontend.

## Features
- User registration and login system
- Create, edit, delete posts
- Add, edit, delete comments
- Profile image update
- Delete user account with all related data
- Fetch and display all posts dynamically

## Tech Stack
Frontend: HTML, CSS, JavaScript  
Backend: Node.js, Express.js  
Database: MongoDB (Mongoose)  
Other: CORS, dotenv, nodemon, multer, cloudinary

## Project Structure
PostBook/
- frontend/ (HTML, CSS, JS files)
- server/ (Express server, models, DB connection)

## API Routes
User:
- POST /registerUser
- POST /getUserInfo
- PUT /updateProfileImage
- DELETE /deleteUser/:userId

Posts:
- GET /getAllPosts
- POST /addNewPost
- PUT /editPost
- DELETE /deletePost/:id/:userId

Comments:
- GET /getAllComments/:postId
- POST /postComment
- PUT /editComment
- DELETE /deleteComment/:commentId/:userId/:postOwnerId

## Setup
1. Clone repo
2. Run `npm install` inside server folder
3. Create .env file with MONGO_URI and PORT
4. Run server using `npm run dev` or `npm start`
5. Open frontend/index.html

## How it works
Frontend sends requests to backend APIs, backend handles data using Express and MongoDB, then returns responses which frontend displays dynamically.

## Purpose
This project is built for learning full stack development, CRUD operations, and API integration.

