
const username = document.getElementById("username");
const password = document.getElementById("password");
const showButton = document.getElementById("togglePassword");
const errorMessage = document.getElementById("errorMessage");
const loginForm = document.getElementById("loginForm");

// Already logged in? Skip login page
if (sessionStorage.getItem("isLoggedIn") === "true") {
    window.location.replace("index.html");
}

// Show / hide password
showButton.addEventListener("click", function () {
    if (password.type === "password") {
        password.type = "text";
        showButton.textContent = "Hide";
    } else {
        password.type = "password";
        showButton.textContent = "Show";
    }
});

// Login validation
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const enteredUsername = username.value.trim();
    const enteredPassword = password.value;

    const savedPassword =
        localStorage.getItem("adminPassword") || "admin@123";

    if (enteredUsername === "") {
        errorMessage.textContent = "Please enter username.";
        errorMessage.style.color = "red";
        return;
    }

    if (enteredPassword === "") {
        errorMessage.textContent = "Please enter password.";
        errorMessage.style.color = "red";
        return;
    }

    if (
        enteredUsername === "admin" &&
        enteredPassword === savedPassword
    ) {
        sessionStorage.setItem("isLoggedIn", "true");
        window.location.href = "index.html";
    } else {
        errorMessage.textContent = "Invalid username or password.";
        errorMessage.style.color = "red";
    }
});

// Clear error message
username.addEventListener("input", function () {
    errorMessage.textContent = "";
});

password.addEventListener("input", function () {
    errorMessage.textContent = "";
});
