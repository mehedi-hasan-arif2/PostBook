// --- Live Backend Server URL Configuration ---
const BASE_URL = " ";

const showLoggedUsername = () => {
    const userNameElement = document.getElementById("logged-username");
    let user = localStorage.getItem("loggedInuser");
    if (user) {
        user = JSON.parse(user);
        userNameElement.innerHTML = `<i class="fa-solid fa-camera"></i> ${user.userName || user.username || "User"}`;
    }
};

const checkLoggedInUser = () => {
    let user = localStorage.getItem("loggedInuser");
    if (!user) {
        window.location.href = "/index.html";
    }
};

const logOut = () => {
    localStorage.clear();
    window.location.href = "/index.html";
};

const fetchAllPosts = async () => {
    try {
        const res = await fetch(`${BASE_URL}/getAllPosts`);
        const data = await res.json();
        showAllPosts(data);
    } catch (err) {
        console.log("Error fetching data from server", err);
    }
};

const showAllPosts = (allPosts) => {
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = "";
    let loggedUser = JSON.parse(localStorage.getItem("loggedInuser"));

    if (!loggedUser) return;

    allPosts.forEach(async (post) => {
        const currentPostId = post.postId || post._id;
        
        // Resolving fallback properties since the backend does not return nested author objects
        const postOwnerId = post.postedUserId || post.userId || currentPostId; 
        const currentLoggedUserId = loggedUser.userId || loggedUser._id;

        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        // Dynamic standard profile configuration fallbacks
        const displayUserImg = post.postedUserImage || loggedUser.userImage || "https://placeholder.co/150";
        const displayUserName = post.postedUserName || loggedUser.userName || "Anonymous";

        postDiv.innerHTML = `
        <div class="post-header">   
            <div class="post-user-image">
                <img src="${displayUserImg}" />
            </div>
            <div class="post-username-time">
                <p class="post-username">${displayUserName}</p>
                <div class="posted-time">
                    <span>${timeDifference(`${post.postedTime}`)}</span> ago
                </div>
            </div>
        </div>
        <div class="post-text">
            <p class="post-text-content">${post.postText}</p>
        </div>
        <div class="post-image">
            ${post.postImageUrl ? `<img src="${post.postImageUrl}" alt="post-image" />` : ''}
        </div>
        `;

        postContainer.appendChild(postDiv);

        // --- Post Actions (Edit/Delete) ---
        const postActionsDiv = document.createElement('div');
        postActionsDiv.classList.add('post-actions');
        postActionsDiv.innerHTML = `
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        `;
        
        // Enforcing loose string criteria normalization across structural object properties
        if (String(currentLoggedUserId) !== String(postOwnerId) && post.postedUserId !== undefined) {
            postActionsDiv.style.display = "none";
        }
        postDiv.appendChild(postActionsDiv);

        // --- Comments Section ---
        const commentsHolderDiv = document.createElement('div');
        commentsHolderDiv.classList.add('comments-holder');
        postDiv.appendChild(commentsHolderDiv);

        // API execution using the dynamic mapped backend route endpoint
        let postComments = await fetchAllCommentsOfAPost(currentPostId);
        if (postComments && postComments.length > 0) {
            postComments.forEach((comment) => {
                let commentClass = "comment";
                const commenterId = comment.commentedUserId || comment.userId;

                if (String(currentLoggedUserId) === String(commenterId)) {
                    commentClass += " my-comment";
                }

                let isCommentOwner = String(currentLoggedUserId) === String(commenterId);
                let isPostOwner = String(currentLoggedUserId) === String(postOwnerId);

                let actionButtons = "";
                if (isCommentOwner) {
                    actionButtons = `
                        <span class="comment-actions">
                            <i class="fa-solid fa-pen-to-square" onclick="handleEditComment('${comment.commentId || comment._id}', '${comment.commentText}')"></i>
                            <i class="fa-solid fa-trash" onclick="handleDeleteComment('${comment.commentId || comment._id}', '${postOwnerId}')"></i>
                        </span>`;
                } else if (isPostOwner) {
                    actionButtons = `
                        <span class="comment-actions">
                            <i class="fa-solid fa-trash" onclick="handleDeleteComment('${comment.commentId || comment._id}', '${postOwnerId}')"></i>
                        </span>`;
                }

                const commentDiv = document.createElement('div');
                commentDiv.className = commentClass;
                
                const commentTimeAgo = timeDifference(comment.commentTime);

                commentDiv.innerHTML = `
                    <div class="comment-user-image">
                        <img src="${comment.commentedUserImage || 'https://placeholder.co/150'}">
                    </div>
                    <div class="comment-text-container">
                        <h4>
                            ${comment.commentedUsername || "Anonymous"} 
                            <span class="comment-time">${commentTimeAgo} ago</span> 
                            ${actionButtons}
                        </h4>
                        <p class="comment-text">${comment.commentText}</p>
                    </div>
                `;
                commentsHolderDiv.appendChild(commentDiv);
            });
        }

        // --- Add New Comment Input ---
        const addNewCommentDiv = document.createElement("div");
        addNewCommentDiv.classList.add("postComment-holder");
        addNewCommentDiv.innerHTML = `
            <div class="post-comment-input-field-holder">
                <input type="text" placeholder="Post your comment" class="postComment-input-field" id="postComment-input-for-postID-${currentPostId}" />
            </div>
            <button onClick="handlePostComment('${currentPostId}')" class="postComment-btn">Comment</button>
        `;
        postDiv.appendChild(addNewCommentDiv);

        // --- Event Listeners for Post Delete/Edit ---
        postActionsDiv.querySelector('.delete-btn').addEventListener('click', async () => {
            if (!confirm("Delete this post?")) return;
            try {
                await fetch(`${BASE_URL}/deletePost/${currentPostId}/${currentLoggedUserId}`, { method: "DELETE" });
                location.reload();
            } catch (err) {
                console.error("Execution failure on post context removal:", err);
            }
        });

        postActionsDiv.querySelector('.edit-btn').addEventListener('click', async () => {
            const newText = prompt("Edit text:", post.postText);
            const newImage = prompt("Edit image URL:", post.postImageUrl || "");
            if (!newText) return;
            try {
                await fetch(`${BASE_URL}/editPost`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postId: currentPostId, postText: newText, postImageUrl: newImage, userId: currentLoggedUserId })
                });
                location.reload();
            } catch (err) {
                console.error("Execution failure on post context updating:", err);
            }
        });
    });
};

const handlePostComment = async (postId) => {
    let user = JSON.parse(localStorage.getItem("loggedInuser"));
    const commentText = document.getElementById(`postComment-input-for-postID-${postId}`).value.trim();
    if (!commentText) return alert("Comment cannot be empty");

    let now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    
    const currentLoggedUserId = user.userId || user._id;

    // Passing redundant property matching variations to guarantee database identification 
    const commmentObject = {
        commentId: String(Math.floor(Math.random() * 100000)),
        postId: postId,
        commentOfPostId: postId,
        commentedUserId: currentLoggedUserId,
        userId: currentLoggedUserId,
        commentedUsername: user.userName || user.username || "Anonymous",
        commentedUserImage: user.userImage || "https://placeholder.co/150",
        commentText: commentText,
        commentTime: now.toISOString(),
    };

    try {
        await fetch(`${BASE_URL}/postComment`, {
            method: 'POST',
            headers: { "content-type": "application/json" },
            body: JSON.stringify(commmentObject),
        });
        location.reload();
    } catch (err) {
        console.error("Execution failure on comment context assignment:", err);
    }
};

const fetchAllCommentsOfAPost = async (postId) => {
    try {
        // Redundant catch router paths targeted to balance uncertain backend routes
        let res = await fetch(`${BASE_URL}/getCommentOfAPost/${postId}`);
        if (!res.ok) {
            res = await fetch(`${BASE_URL}/getAllComments/${postId}`);
        }
        return await res.json();
    } catch (err) {
        return [];
    }
};

const handleAddNewPost = async () => {
    let user = JSON.parse(localStorage.getItem("loggedInuser"));
    const postText = document.getElementById('newPost-text').value.trim();
    const postImageUrl = document.getElementById('newPost-image').value.trim();
    if (!postText) return alert("Post text is empty");

    let now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    const currentLoggedUserId = user.userId || user._id;

    const postObject = {
        userId: currentLoggedUserId,
        postedUserId: currentLoggedUserId, 
        postedUserName: user.userName || user.username,
        postedUserImage: user.userImage || "",
        postedTime: now.toISOString(),
        postText: postText,
        postImageUrl: postImageUrl
    };

    try {
        const res = await fetch(`${BASE_URL}/addNewPost`, {
            method: 'POST',
            headers: { "content-type": "application/json" },
            body: JSON.stringify(postObject),
        });
        if (res.ok) {
            location.reload(); 
        }
    } catch (error) {
        console.error("Error posting:", error);
    }
};

const changeProfileImage = async () => {
    const newImageUrl = prompt("New Profile Image URL:");
    if (!newImageUrl) return;
    let user = JSON.parse(localStorage.getItem("loggedInuser"));

    const currentLoggedUserId = user.userId || user._id;

    try {
        const res = await fetch(`${BASE_URL}/updateProfileImage`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentLoggedUserId, userImage: newImageUrl })
        });
        if (res.ok) {
            user.userImage = newImageUrl;
            localStorage.setItem("loggedInuser", JSON.stringify(user));
            location.reload();
        }
    } catch (err) {
        console.error("Profile image update failed:", err);
    }
};

const handleDeleteComment = async (commentId, postOwnerId) => {
    if (!confirm("Delete comment?")) return;
    let user = JSON.parse(localStorage.getItem("loggedInuser"));
    const currentLoggedUserId = user.userId || user._id;

    try {
        await fetch(`${BASE_URL}/deleteComment/${commentId}/${currentLoggedUserId}/${postOwnerId}`, { method: "DELETE" });
        location.reload();
    } catch (err) {
        console.error("Comment deletion failed:", err);
    }
};

const handleEditComment = async (commentId, oldText) => {
    const newText = prompt("Edit comment:", oldText);
    if (!newText || newText === oldText) return;
    let user = JSON.parse(localStorage.getItem("loggedInuser"));
    const currentLoggedUserId = user.userId || user._id;

    try {
        await fetch(`${BASE_URL}/editComment`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentId, commentText: newText, userId: currentLoggedUserId })
        });
        location.reload();
    } catch (err) {
        console.error("Comment edit failed:", err);
    }
};

const handleDeleteAccount = async () => {
    if (!confirm("Delete account forever?")) return;
    let user = JSON.parse(localStorage.getItem("loggedInuser"));
    const currentLoggedUserId = user.userId || user._id;

    try {
        const res = await fetch(`${BASE_URL}/deleteUser/${currentLoggedUserId}`, { method: "DELETE" });
        if (res.ok) {
            localStorage.clear();
            window.location.href = "/index.html";
        }
    } catch (err) {
        console.error("Account deletion failed:", err);
    }
};

// --- Execution Stack Initialization ---
showLoggedUsername();
checkLoggedInUser();
fetchAllPosts();