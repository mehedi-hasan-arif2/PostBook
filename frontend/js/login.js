// --- Live Backend Server URL Configuration ---
const BASE_URL = " ";

// Toggle login/register views
const toggleRegister = () => {
  document.getElementById("login-form").classList.toggle("hidden");
  document.getElementById("register-form").classList.toggle("hidden");
};

// Register new user with synchronized properties
const handleRegister = async (e) => {
  if (e && e.preventDefault) e.preventDefault();

  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const image = document.getElementById("reg-image").value.trim();

  if (!username || !password) {
    alert("All fields required");
    return;
  }

  if (username.length < 4) {
    alert("Username must be at least 4 characters");
    return;
  }

  if (password.length < 3) {
    alert("Password must be at least 3 characters");
    return;
  }

  // Formatting specific payloads matching the backend model criteria
  const registrationPayload = { 
    username: username, 
    userName: username, 
    password: password, 
    image: image || "https://placeholder.co/150",
    userImage: image || "https://placeholder.co/150"
  };

  try {
    const res = await fetch(`${BASE_URL}/registerUser`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(registrationPayload)
    });

    const data = await res.json();

    if (data.success) {
      alert("Account created. Please login.");
      toggleRegister();
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    console.error("Error during registration network request:", err);
  }
};

// Login function with robust fallback handling
const handleLogin = async (e) => {
  if (e && e.preventDefault) e.preventDefault();

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!username || !password) {
    alert("Please fill in all fields");
    return;
  }

  const user = {
    username: username,
    password: password
  };

  const userInfo = await fetchUserInfo(user);
  console.log(userInfo);
  const errorElement = document.getElementById("user-login-error");
    
  if (!userInfo || userInfo.length === 0) {
    errorElement.classList.remove("hidden");
  } else {
    errorElement.classList.add("hidden");

    let loggedInUserObj = userInfo[0];
    
    // Inject dynamic fallbacks to ensure full cross-file compatibility
    if (loggedInUserObj && !loggedInUserObj.userId) {
      loggedInUserObj.userId = loggedInUserObj._id || loggedInUserObj.id;
    }
    if (loggedInUserObj && !loggedInUserObj.userName) {
      loggedInUserObj.userName = loggedInUserObj.username;
    }
    if (loggedInUserObj && !loggedInUserObj.userImage) {
      loggedInUserObj.userImage = loggedInUserObj.image;
    }

    // Save standardized user object before navigating to dashboard
    localStorage.setItem("loggedInuser", JSON.stringify(loggedInUserObj));
    window.location.href = "/post.html";
  }
};

// Isolated API wrapper extracting single user query context
const fetchUserInfo = async (user) => {
  let data;
  try {
    const res = await fetch(`${BASE_URL}/getUserInfo`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(user),
    });

    data = await res.json();
  } catch (err) {
    console.log("Error connecting to the server: ", err);
  } finally {
    return data;
  }
};