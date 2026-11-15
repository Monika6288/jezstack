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

// Load records
const students = getStoredData("students", []);
const courses = getStoredData("courses", []);
const trainers = getStoredData("trainers", []);
const attendance = getStoredData("attendance", {});
const assignments = getStoredData("assignments", []);

// Admin profile
const adminProfile = getStoredData("adminProfile", null);
const adminName = adminProfile && adminProfile.name
    ? adminProfile.name
    : "Admin";

const topName = document.getElementById("topAdminName");
if (topName) topName.textContent = adminName;
let student = null;

// Format date
function formatDate(date) {
    if (!date) return "—";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Show missing student message
function showNotFound() {
    document.getElementById("studentDetailsContent").hidden = true;
    document.querySelector(".page-actions").hidden = true;
    document.getElementById("notFound").hidden = false;
}

// Display student personal information
function displayStudentInformation() {
    document.getElementById("studentAvatar").textContent =
        student.name ? student.name.charAt(0).toUpperCase() : "S";

    document.getElementById("detailName").textContent = student.name || "—";

    document.getElementById("detailStudentId").textContent =
        "Student ID: " + (student.studentId || student.id || "—");

    document.getElementById("detailFullName").textContent =
        student.name || "—";

    document.getElementById("detailEmail").textContent =
        student.email || "—";

    document.getElementById("detailPhone").textContent =
        student.phone || "Not provided";

    document.getElementById("detailDOB").textContent =
        formatDate(student.dob);

    document.getElementById("detailJoiningDate").textContent =
        formatDate(student.joiningDate);

    document.getElementById("detailStatusText").textContent =
        student.status || "Active";

    const statusElement = document.getElementById("detailStatus");
    const status = student.status || "Active";

    statusElement.textContent = status;
    statusElement.className =
        "status-badge status-" + status.toLowerCase();

    // Edit button
    document.getElementById("editStudentBtn").addEventListener("click", function () {
        if (window.showSection) window.showSection("students");
        if (window.editStudentFromDetails) window.editStudentFromDetails(student.studentId || student.id);
    });
}

// Display course and trainer
function displayCourseInformation() {
    const course = courses.find(function (item) {
        return item.name === student.course;
    });

    document.getElementById("detailCourse").textContent =
        student.course || "Not assigned";

    document.getElementById("detailCourseDuration").textContent =
        course ? (course.duration || "Not specified") : "Not available";

    const trainer = course
        ? trainers.find(function (item) {
            return (
                item.name === course.trainer ||
                item.email === course.trainer
            );
        })
        : null;

    document.getElementById("detailTrainer").textContent =
        trainer ? trainer.name : (course && course.trainer
            ? course.trainer
            : "Not assigned");

    document.getElementById("detailTrainerEmail").textContent =
        trainer && trainer.email ? trainer.email : "";
}

// Attendance summary
function displayAttendanceSummary() {
    let present = 0;
    let absent = 0;
    let leave = 0;

    Object.values(attendance).forEach(function (dateRecords) {
        if (!dateRecords || typeof dateRecords !== "object") return;

        // Existing project stores attendance by student email.
        const status = dateRecords[student.email];

        if (status === "Present") {
            present++;
        } else if (status === "Absent") {
            absent++;
        } else if (status === "Leave") {
            leave++;
        }
    });

    const totalClassDays = present + absent;

    // Leave is excluded from the percentage calculation.
    const percentage = totalClassDays > 0
        ? Math.round((present / totalClassDays) * 100)
        : 0;

    document.getElementById("presentDays").textContent = present;
    document.getElementById("absentDays").textContent = absent;
    document.getElementById("leaveDays").textContent = leave;

    document.getElementById("attendancePercentage").textContent =
        percentage + "%";

    document.getElementById("attendanceProgressBar").style.width =
        percentage + "%";

    document.getElementById("attendanceExplanation").textContent =
        "Attendance = Present days ÷ (Present + Absent days) × 100. Leave days are excluded.";
}

// Find student-specific submission information
function getSubmissionStatus(assignment) {
    const submissions = assignment.submissions;

    if (submissions && typeof submissions === "object") {
        const submission =
            submissions[student.email] ||
            submissions[student.studentId] ||
            submissions[student.id];

        if (typeof submission === "string") {
            return submission;
        }

        if (submission && typeof submission === "object") {
            return submission.status || "Not submitted";
        }
    }

    // Support a single-student assignment record, if present.
    if (
        assignment.studentEmail &&
        assignment.studentEmail.toLowerCase() === student.email.toLowerCase()
    ) {
        return assignment.submissionStatus ||
            assignment.status ||
            "Not submitted";
    }

    // The old assignment-level status is not proof of this
    // individual student's submission.
    return "Not submitted";
}

// Normalize submission status
function normalizeSubmissionStatus(status) {
    const value = String(status || "").toLowerCase();

    if (value === "submitted" || value === "completed") {
        return "Submitted";
    }

    if (value === "late") {
        return "Late";
    }

    return "Not submitted";
}

// Display assignment summary
function displayAssignmentSummary() {
    const studentAssignments = assignments.filter(function (assignment) {
        return assignment.course === student.course;
    });

    let submitted = 0;
    let late = 0;
    let notSubmitted = 0;

    const tableBody = document.getElementById("assignmentTableBody");
    tableBody.innerHTML = "";

    if (studentAssignments.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.className = "empty-cell";
        cell.textContent = "No assignments available for this course.";

        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    studentAssignments.forEach(function (assignment) {
        const status = normalizeSubmissionStatus(
            getSubmissionStatus(assignment)
        );

        if (status === "Submitted") {
            submitted++;
        } else if (status === "Late") {
            late++;
        } else {
            notSubmitted++;
        }

        const row = document.createElement("tr");

        const titleCell = document.createElement("td");
        titleCell.textContent = assignment.title || "Untitled assignment";

        const dueDateCell = document.createElement("td");
        dueDateCell.textContent = formatDate(assignment.dueDate);

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = "assignment-status";

        if (status === "Submitted") {
            badge.classList.add("assignment-submitted");
        } else if (status === "Late") {
            badge.classList.add("assignment-late");
        } else {
            badge.classList.add("assignment-not-submitted");
        }

        badge.textContent = status;

        statusCell.appendChild(badge);

        row.appendChild(titleCell);
        row.appendChild(dueDateCell);
        row.appendChild(statusCell);

        tableBody.appendChild(row);
    });

    document.getElementById("totalAssignments").textContent =
        studentAssignments.length;

    document.getElementById("submittedAssignments").textContent = submitted;
    document.getElementById("lateAssignments").textContent = late;
    document.getElementById("notSubmittedAssignments").textContent =
        notSubmitted;
}

window.displayStudentDetails = function(email) {
    student = students.find(function(item){ return item.email && item.email.toLowerCase() === (email || "").toLowerCase(); });
    if (!student) { showNotFound(); }
    else {
        document.getElementById("notFound").hidden = true;
        document.getElementById("studentDetailsContent").hidden = false;
        document.querySelector(".page-actions").hidden = false;
        displayStudentInformation(); displayCourseInformation(); displayAttendanceSummary(); displayAssignmentSummary();
    }
    if (window.showSection) window.showSection("student-details");
};

})();
