
(function(){

const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileMessage = document.getElementById("profileMessage");

const passwordForm = document.getElementById("passwordForm");
const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const passwordMessage = document.getElementById("passwordMessage");

// Safe storage reader
function readStorage(key, fallback) {
    try {
        const savedData = localStorage.getItem(key);
        return savedData ? JSON.parse(savedData) : fallback;
    } catch (error) {
        console.error("Storage read error:", error);
        return fallback;
    }
}

// Load profile details
function loadProfile() {
    const profile = readStorage("adminProfile", {
        name: "Admin",
        email: ""
    });

    profileName.value = profile.name || "Admin";
    profileEmail.value = profile.email || "";

    updateProfileDisplay(profile.name || "Admin", profile.email || "");
}

// Update profile display
function updateProfileDisplay(name, email) {
    const initial = name.trim().charAt(0).toUpperCase() || "A";

    document.getElementById("profileDisplayName").textContent = name;
    document.getElementById("profileDisplayEmail").textContent =
        email || "No email added";

    document.getElementById("profileAvatar").textContent = initial;
    document.getElementById("sidebarAvatar").textContent = initial;
    document.getElementById("topbarAvatar").textContent = initial;

    const sidebarName = document.getElementById("sidebarAdminName"); if (sidebarName) sidebarName.textContent = name;
    const topName = document.getElementById("topAdminName"); if (topName) topName.textContent = name;
}

// Message helper
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = "form-message " + type;
}

// Field error helper
function showFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    input.classList.toggle("invalid", message !== "");
}

// Email validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Save profile
profileForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = profileName.value.trim();
    const email = profileEmail.value.trim();

    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");

    showFieldError(profileName, nameError, "");
    showFieldError(profileEmail, emailError, "");
    showMessage(profileMessage, "", "");

    let isValid = true;

    if (name.length < 2) {
        showFieldError(
            profileName,
            nameError,
            "Name must contain at least 2 characters."
        );
        isValid = false;
    }

    if (!isValidEmail(email)) {
        showFieldError(
            profileEmail,
            emailError,
            "Please enter a valid email address."
        );
        isValid = false;
    }

    if (!isValid) {
        showMessage(
            profileMessage,
            "Please correct the highlighted fields.",
            "error"
        );
        return;
    }

    const updatedProfile = {
        name: name,
        email: email
    };

    localStorage.setItem(
        "adminProfile",
        JSON.stringify(updatedProfile)
    );

    updateProfileDisplay(name, email);

    showMessage(
        profileMessage,
        "Profile details updated successfully.",
        "success"
    );
});

// Show / hide password buttons
document.querySelectorAll(".toggle-password").forEach(function (button) {
    button.addEventListener("click", function () {
        const input = document.getElementById(button.dataset.target);

        if (input.type === "password") {
            input.type = "text";
            button.textContent = "Hide";
        } else {
            input.type = "password";
            button.textContent = "Show";
        }
    });
});

// Change password
passwordForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const current = currentPassword.value;
    const newPass = newPassword.value;
    const confirmPass = confirmPassword.value;

    const currentError = document.getElementById("currentPasswordError");
    const newError = document.getElementById("newPasswordError");
    const confirmError = document.getElementById("confirmPasswordError");

    // Clear previous errors
    showFieldError(currentPassword, currentError, "");
    showFieldError(newPassword, newError, "");
    showFieldError(confirmPassword, confirmError, "");
    showMessage(passwordMessage, "", "");

    let isValid = true;

    // Required validation
    if (!current) {
        showFieldError(
            currentPassword,
            currentError,
            "Enter your current password."
        );
        isValid = false;
    }

    if (!newPass) {
        showFieldError(
            newPassword,
            newError,
            "Enter a new password."
        );
        isValid = false;
    } else if (newPass.length < 6) {
        showFieldError(
            newPassword,
            newError,
            "Password must contain at least 6 characters."
        );
        isValid = false;
    }

    if (!confirmPass) {
        showFieldError(
            confirmPassword,
            confirmError,
            "Confirm your new password."
        );
        isValid = false;
    } else if (newPass !== confirmPass) {
        showFieldError(
            confirmPassword,
            confirmError,
            "New passwords do not match."
        );
        isValid = false;
    }

    if (!isValid) {
        showMessage(
            passwordMessage,
            "Please correct the highlighted fields.",
            "error"
        );
        return;
    }

    // Read current saved password
    const savedPassword = localStorage.getItem("adminPassword") || "admin@123";

    if (current !== savedPassword) {
        showFieldError(
            currentPassword,
            currentError,
            "Current password is incorrect."
        );

        showMessage(
            passwordMessage,
            "Password was not changed.",
            "error"
        );
        return;
    }

    if (newPass === current) {
        showFieldError(
            newPassword,
            newError,
            "New password must be different from the current password."
        );

        showMessage(
            passwordMessage,
            "Choose a different password.",
            "error"
        );
        return;
    }

    // Save new password
    localStorage.setItem("adminPassword", newPass);

    passwordForm.reset();

    // Reset all password visibility buttons
    document.querySelectorAll(".toggle-password").forEach(function (button) {
        button.textContent = "Show";
    });

    showMessage(
        passwordMessage,
        "Password changed successfully. Use your new password next time you log in.",
        "success"
    );
});

// Clear field errors while typing
[
    [profileName, "nameError"],
    [profileEmail, "emailError"],
    [currentPassword, "currentPasswordError"],
    [newPassword, "newPasswordError"],
    [confirmPassword, "confirmPasswordError"]
].forEach(function (item) {
    item[0].addEventListener("input", function () {
        showFieldError(
            item[0],
            document.getElementById(item[1]),
            ""
        );
    });
});

// Initial page setup
loadProfile();

})();
