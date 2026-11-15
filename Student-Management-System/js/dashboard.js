
(function(){

// Safe localStorage reading
function getStoredData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error("Error reading " + key, error);
        return fallback;
    }
}

// Load application data
const students = getStoredData("students", []);
const trainers = getStoredData("trainers", []);
const courses = getStoredData("courses", []);
const assignments = getStoredData("assignments", []);
const attendance = getStoredData("attendance", {});
const adminProfile = getStoredData("adminProfile", null);

// Current date
function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const today = getToday();

// Display date
document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// Admin name
const adminName =
    adminProfile && adminProfile.name
        ? adminProfile.name
        : "Admin";

document.getElementById("adminName").textContent = adminName;
const sidebarName = document.getElementById("sidebarAdminName"); if (sidebarName) sidebarName.textContent = adminName;
const topName = document.getElementById("topAdminName"); if (topName) topName.textContent = adminName;
document.getElementById("welcomeAdminName").textContent = adminName;

// Overview totals
document.getElementById("totalStudents").textContent =
    students.length;

document.getElementById("totalTrainers").textContent =
    trainers.length;

// Count active courses.
// Older course records without a status are treated as active.
const activeCourses = courses.filter(function (course) {
    return !course.status || course.status === "Active";
});

document.getElementById("totalCourses").textContent =
    activeCourses.length;

// Today's attendance
const todayAttendance = attendance[today] || {};

let present = 0;
let absent = 0;
let leave = 0;

Object.values(todayAttendance).forEach(function (status) {
    if (status === "Present") {
        present++;
    } else if (status === "Absent") {
        absent++;
    } else if (status === "Leave") {
        leave++;
    }
});

document.getElementById("attendancePresent").textContent = present;
document.getElementById("attendanceAbsent").textContent =
    absent + " absent";
document.getElementById("attendanceLeave").textContent =
    leave + " on leave";

// Assignment summary
let pending = 0;
let overdue = 0;
let completed = 0;

assignments.forEach(function (assignment) {
    if (assignment.status === "Completed") {
        completed++;
    } else if (assignment.dueDate && assignment.dueDate < today) {
        overdue++;
    } else {
        pending++;
    }
});

document.getElementById("pendingAssignments").textContent = pending;
document.getElementById("overdueAssignments").textContent = overdue;
document.getElementById("completedAssignments").textContent = completed;

// Recent activity
function displayRecentActivity() {
    const activityContainer = document.getElementById("recentActivity");

    const activities = [];

    students.slice(-3).reverse().forEach(function (student) {
        activities.push({
            icon: "♙",
            title: student.name || "New student",
            description: "Student record",
            type: "Student"
        });
    });

    courses.slice(-2).reverse().forEach(function (course) {
        activities.push({
            icon: "▤",
            title: course.name || "New course",
            description: "Course record",
            type: "Course"
        });
    });

    trainers.slice(-2).reverse().forEach(function (trainer) {
        activities.push({
            icon: "♟",
            title: trainer.name || "New trainer",
            description: "Trainer record",
            type: "Trainer"
        });
    });

    assignments.slice(-2).reverse().forEach(function (assignment) {
        activities.push({
            icon: "▣",
            title: assignment.title || "New assignment",
            description: "Assignment record",
            type: "Assignment"
        });
    });

    if (activities.length === 0) {
        activityContainer.innerHTML =
            '<p class="empty-message">No records available yet. Add your first student, course or trainer.</p>';
        return;
    }

    activityContainer.innerHTML = "";

    activities.slice(0, 6).forEach(function (activity) {
        const item = document.createElement("div");
        item.className = "activity-item";

        const icon = document.createElement("div");
        icon.className = "activity-icon";
        icon.textContent = activity.icon;

        const info = document.createElement("div");
        info.className = "activity-info";

        const title = document.createElement("strong");
        title.textContent = activity.title;

        const description = document.createElement("small");
        description.textContent = activity.description;

        const type = document.createElement("span");
        type.className = "activity-type";
        type.textContent = activity.type;

        info.appendChild(title);
        info.appendChild(description);

        item.appendChild(icon);
        item.appendChild(info);
        item.appendChild(type);

        activityContainer.appendChild(item);
    });
}

displayRecentActivity();

})();
