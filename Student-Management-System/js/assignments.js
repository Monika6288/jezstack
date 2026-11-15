
(function(){

// DOM elements
const assignmentForm = document.getElementById("assignmentForm");
const assignmentTitle = document.getElementById("assignmentTitle");
const assignmentDescription = document.getElementById("assignmentDescription");
const assignmentCourse = document.getElementById("assignmentCourse");
const assignmentAssignedDate = document.getElementById("assignmentAssignedDate");
const assignmentDueDate = document.getElementById("assignmentDueDate");
const assignmentMessage = document.getElementById("assignmentMessage");

const assignmentTableBody = document.getElementById("assignmentTableBody");
const assignmentSearch = document.getElementById("assignmentSearch");
const filterCourse = document.getElementById("filterCourse");
const filterStatus = document.getElementById("filterStatus");
const assignmentSort = document.getElementById("assignmentSort");

const editingAssignmentId = document.getElementById("editingAssignmentId");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const submissionModal = document.getElementById("submissionModal");
const submissionTableBody = document.getElementById("submissionTableBody");

const previousPage = document.getElementById("previousPage");
const nextPage = document.getElementById("nextPage");

const pageSize = 6;
let currentPage = 1;
let activeAssignmentId = null;

// Safe localStorage reader
function getStoredData(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
        console.error("Unable to read " + key, error);
        return fallback;
    }
}

// Load application data
let assignments = getStoredData("assignments", []);
const courses = getStoredData("courses", []);
const students = getStoredData("students", []);

// Admin profile
const adminProfile = getStoredData("adminProfile", null);
const adminName = adminProfile && adminProfile.name
    ? adminProfile.name
    : "Admin";

const sidebarName = document.getElementById("sidebarAdminName"); if (sidebarName) sidebarName.textContent = adminName;
const topName = document.getElementById("topAdminName"); if (topName) topName.textContent = adminName;

// Today's local date
function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Generate unique assignment ID
function generateAssignmentId() {
    return "ASG" + Date.now().toString(36).toUpperCase();
}

// Save assignments
function saveAssignments() {
    try {
        localStorage.setItem("assignments", JSON.stringify(assignments));
        return true;
    } catch (error) {
        console.error("Unable to save assignments:", error);
        showMessage(
            "Unable to save data. Check your browser storage.",
            "error"
        );
        return false;
    }
}

// Display message
function showMessage(message, type) {
    assignmentMessage.textContent = message;
    assignmentMessage.className = "message-box " + (type || "");
}

// Format date
function formatDate(dateString) {
    if (!dateString) return "—";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Find student email
function getStudentEmail(student) {
    return (student.email || "").trim().toLowerCase();
}

// Get student course
function getStudentCourse(student) {
    return student.course || student.courseName || "";
}

// Find students assigned to a course
function getCourseStudents(courseName) {
    return students.filter(function (student) {
        return getStudentCourse(student) === courseName;
    });
}

// Create default submission records for students
function createSubmissions(courseName) {
    const submissions = {};

    getCourseStudents(courseName).forEach(function (student) {
        const email = getStudentEmail(student);

        if (email) {
            submissions[email] = {
                status: "Not submitted",
                marks: "",
                feedback: "",
                submittedDate: ""
            };
        }
    });

    return submissions;
}

// Get submission for a student
function getSubmission(assignment, email) {
    if (!assignment.submissions) {
        assignment.submissions = {};
    }

    if (!assignment.submissions[email]) {
        assignment.submissions[email] = {
            status: "Not submitted",
            marks: "",
            feedback: "",
            submittedDate: ""
        };
    }

    return assignment.submissions[email];
}

// Migrate old assignment records
function migrateAssignments() {
    let changed = false;

    assignments = assignments.map(function (assignment, index) {
        const updated = { ...assignment };

        if (!updated.id) {
            updated.id = generateAssignmentId() + index;
            changed = true;
        }

        if (!updated.description) {
            updated.description = "No description provided.";
            changed = true;
        }

        if (!updated.assignedDate) {
            updated.assignedDate = getToday();
            changed = true;
        }

        if (!updated.submissions || typeof updated.submissions !== "object") {
            updated.submissions = {};
            changed = true;
        }

        // Old Pending/Completed values are not student submissions.
        // Create individual Not submitted records for the course students.
        getCourseStudents(updated.course).forEach(function (student) {
            const email = getStudentEmail(student);

            if (email && !updated.submissions[email]) {
                updated.submissions[email] = {
                    status: "Not submitted",
                    marks: "",
                    feedback: "",
                    submittedDate: ""
                };
                changed = true;
            }
        });

        return updated;
    });

    if (changed) {
        saveAssignments();
    }
}

// Course dropdowns
function loadCourseOptions() {
    assignmentCourse.innerHTML =
        '<option value="">Select course</option>';

    filterCourse.innerHTML =
        '<option value="">All Courses</option>';

    courses.forEach(function (course) {
        const option = document.createElement("option");

        option.value = course.name;
        option.textContent = course.name;

        assignmentCourse.appendChild(option);

        filterCourse.appendChild(option.cloneNode(true));
    });
}

// Clear validation messages
function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (element) {
        element.textContent = "";
    });
}

// Display a field error
function setFieldError(id, message) {
    document.getElementById(id + "Error").textContent = message;
}

// Validate assignment form
function validateAssignment(data) {
    clearErrors();

    let valid = true;

    if (data.title.length < 3) {
        setFieldError("title", "Title must contain at least 3 characters.");
        valid = false;
    }

    if (!data.course) {
        setFieldError("course", "Please select a course.");
        valid = false;
    }

    if (data.description.length < 5) {
        setFieldError(
            "description",
            "Please enter a meaningful assignment description."
        );
        valid = false;
    }

    if (!data.assignedDate) {
        setFieldError("assignedDate", "Select the assigned date.");
        valid = false;
    }

    if (!data.dueDate) {
        setFieldError("dueDate", "Select the due date.");
        valid = false;
    }

    if (
        data.assignedDate &&
        data.dueDate &&
        data.dueDate < data.assignedDate
    ) {
        setFieldError(
            "dueDate",
            "Due date cannot be earlier than the assigned date."
        );
        valid = false;
    }

    const duplicate = assignments.some(function (assignment) {
        return (
            assignment.title.toLowerCase() === data.title.toLowerCase() &&
            assignment.course === data.course &&
            assignment.id !== editingAssignmentId.value
        );
    });

    if (duplicate) {
        setFieldError(
            "title",
            "This assignment title already exists for this course."
        );
        valid = false;
    }

    return valid;
}

// Reset assignment form
function resetAssignmentForm() {
    assignmentForm.reset();
    editingAssignmentId.value = "";

    assignmentAssignedDate.value = getToday();
    assignmentAssignedDate.max = getToday();
    assignmentDueDate.min = getToday();

    document.getElementById("formHeading").textContent =
        "Create New Assignment";

    document.getElementById("saveAssignmentBtn").textContent =
        "Create Assignment";

    cancelEditBtn.hidden = true;

    clearErrors();
    showMessage("", "");
}

// Cancel editing
cancelEditBtn.addEventListener("click", resetAssignmentForm);

// Clear form button
document.getElementById("resetAssignmentBtn").addEventListener("click", function () {
    setTimeout(function () {
        editingAssignmentId.value = "";
        assignmentAssignedDate.value = getToday();

        document.getElementById("formHeading").textContent =
            "Create New Assignment";

        document.getElementById("saveAssignmentBtn").textContent =
            "Create Assignment";

        cancelEditBtn.hidden = true;
        clearErrors();
        showMessage("", "");
    }, 0);
});

// Create or update assignment
assignmentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = {
        title: assignmentTitle.value.trim(),
        description: assignmentDescription.value.trim(),
        course: assignmentCourse.value,
        assignedDate: assignmentAssignedDate.value,
        dueDate: assignmentDueDate.value
    };

    if (!validateAssignment(data)) {
        showMessage("Please correct the errors in the form.", "error");
        return;
    }

    if (editingAssignmentId.value) {
        const index = assignments.findIndex(function (assignment) {
            return assignment.id === editingAssignmentId.value;
        });

        if (index === -1) return;

        const oldAssignment = assignments[index];

        const updatedSubmissions = {
            ...oldAssignment.submissions
        };

        // When changing course, reset only the student list relationship.
        if (oldAssignment.course !== data.course) {
            const newSubmissions = {};

            getCourseStudents(data.course).forEach(function (student) {
                const email = getStudentEmail(student);

                if (email) {
                    newSubmissions[email] = updatedSubmissions[email] || {
                        status: "Not submitted",
                        marks: "",
                        feedback: "",
                        submittedDate: ""
                    };
                }
            });

            assignments[index] = {
                ...oldAssignment,
                ...data,
                submissions: newSubmissions
            };
        } else {
            assignments[index] = {
                ...oldAssignment,
                ...data,
                submissions: updatedSubmissions
            };
        }

        if (!saveAssignments()) return;

        renderAssignments();
        updateStatistics();
        resetAssignmentForm();

        showMessage("Assignment updated successfully.", "success");

    } else {
        const newAssignment = {
            id: generateAssignmentId(),
            ...data,
            submissions: createSubmissions(data.course)
        };

        assignments.push(newAssignment);

        if (!saveAssignments()) {
            assignments.pop();
            return;
        }

        renderAssignments();
        updateStatistics();
        resetAssignmentForm();

        showMessage("Assignment created successfully.", "success");
    }
});

// Get assignment submission counts
function getSubmissionCounts(assignment) {
    const courseStudents = getCourseStudents(assignment.course);

    let submitted = 0;
    let notSubmitted = 0;
    let late = 0;

    courseStudents.forEach(function (student) {
        const email = getStudentEmail(student);
        const submission = getSubmission(assignment, email);

        if (submission.status === "Submitted") submitted++;
        else if (submission.status === "Late") late++;
        else notSubmitted++;
    });

    return {
        total: courseStudents.length,
        submitted: submitted,
        notSubmitted: notSubmitted,
        late: late
    };
}

// Update summary cards
function updateStatistics() {
    let submitted = 0;
    let notSubmitted = 0;
    let late = 0;

    assignments.forEach(function (assignment) {
        const counts = getSubmissionCounts(assignment);

        submitted += counts.submitted;
        notSubmitted += counts.notSubmitted;
        late += counts.late;
    });

    document.getElementById("totalAssignments").textContent =
        assignments.length;

    document.getElementById("submittedCount").textContent =
        submitted;

    document.getElementById("notSubmittedCount").textContent =
        notSubmitted;

    document.getElementById("lateCount").textContent =
        late;
}

// Check whether an assignment matches the selected status
function matchesSubmissionStatus(assignment, status) {
    if (!status) return true;

    const counts = getSubmissionCounts(assignment);

    if (status === "Submitted") {
        return counts.submitted > 0;
    }

    if (status === "Late") {
        return counts.late > 0;
    }

    if (status === "Not submitted") {
        return counts.notSubmitted > 0;
    }

    return true;
}

// Create table cell
function createCell(value, className) {
    const cell = document.createElement("td");
    cell.textContent = value || "—";

    if (className) {
        cell.className = className;
    }

    return cell;
}

// Render assignments
function renderAssignments() {
    assignmentTableBody.innerHTML = "";

    const searchValue = assignmentSearch.value.trim().toLowerCase();
    const selectedCourse = filterCourse.value;
    const selectedStatus = filterStatus.value;

    let filteredAssignments = assignments.filter(function (assignment) {
        const matchesSearch =
            assignment.title.toLowerCase().includes(searchValue) ||
            assignment.description.toLowerCase().includes(searchValue);

        const matchesCourse =
            !selectedCourse || assignment.course === selectedCourse;

        return matchesSearch &&
            matchesCourse &&
            matchesSubmissionStatus(assignment, selectedStatus);
    });

    // Sorting
    filteredAssignments.sort(function (a, b) {
        switch (assignmentSort.value) {
            case "due-desc":
                return b.dueDate.localeCompare(a.dueDate);

            case "title-asc":
                return a.title.localeCompare(b.title);

            case "title-desc":
                return b.title.localeCompare(a.title);

            default:
                return a.dueDate.localeCompare(b.dueDate);
        }
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filteredAssignments.length / pageSize)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * pageSize;

    const visibleAssignments = filteredAssignments.slice(
        startIndex,
        startIndex + pageSize
    );

    if (visibleAssignments.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.className = "empty-cell";
        cell.textContent = assignments.length === 0
            ? "No assignments created yet. Use the form above to create one."
            : "No assignments match your search or filters.";

        row.appendChild(cell);
        assignmentTableBody.appendChild(row);
    }

    visibleAssignments.forEach(function (assignment) {
        const row = document.createElement("tr");

        // Assignment title and description
        const titleCell = document.createElement("td");

        const title = document.createElement("span");
        title.className = "assignment-title";
        title.textContent = assignment.title;

        const description = document.createElement("span");
        description.className = "assignment-description";
        description.textContent = assignment.description;

        titleCell.appendChild(title);
        titleCell.appendChild(description);

        row.appendChild(titleCell);

        // Course
        const courseCell = document.createElement("td");
        const courseChip = document.createElement("span");

        courseChip.className = "course-chip";
        courseChip.textContent = assignment.course;

        courseCell.appendChild(courseChip);
        row.appendChild(courseCell);

        row.appendChild(createCell(formatDate(assignment.assignedDate)));
        row.appendChild(createCell(formatDate(assignment.dueDate)));

        // Submission counts
        const counts = getSubmissionCounts(assignment);

        const submissionCell = document.createElement("td");
        const countWrapper = document.createElement("div");

        countWrapper.className = "submission-count";

        const mainCount = document.createElement("strong");
        mainCount.textContent =
            `${counts.submitted + counts.late} / ${counts.total} received`;

        const details = document.createElement("small");
        details.textContent =
            `${counts.notSubmitted} not submitted · ${counts.late} late`;

        countWrapper.appendChild(mainCount);
        countWrapper.appendChild(details);
        submissionCell.appendChild(countWrapper);

        row.appendChild(submissionCell);

        // Actions
        const actionCell = document.createElement("td");
        const actionWrapper = document.createElement("div");

        actionWrapper.className = "action-buttons";

        const manageButton = document.createElement("button");
        manageButton.type = "button";
        manageButton.className = "action-btn manage-btn";
        manageButton.textContent = "Submissions";

        manageButton.addEventListener("click", function () {
            openSubmissionModal(assignment.id);
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editAssignment(assignment.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteAssignment(assignment.id);
        });

        actionWrapper.appendChild(manageButton);
        actionWrapper.appendChild(editButton);
        actionWrapper.appendChild(deleteButton);

        actionCell.appendChild(actionWrapper);
        row.appendChild(actionCell);

        assignmentTableBody.appendChild(row);
    });

    document.getElementById("assignmentRecordCount").textContent =
        filteredAssignments.length + " assignments";

    document.getElementById("assignmentPaginationInfo").textContent =
        filteredAssignments.length === 0
            ? "Showing 0 assignments"
            : `Showing ${startIndex + 1} to ${Math.min(
                startIndex + pageSize,
                filteredAssignments.length
            )} of ${filteredAssignments.length} assignments`;

    document.getElementById("pageNumber").textContent =
        `${currentPage} / ${totalPages}`;

    previousPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

// Edit assignment
function editAssignment(id) {
    const assignment = assignments.find(function (item) {
        return item.id === id;
    });

    if (!assignment) return;

    editingAssignmentId.value = assignment.id;

    assignmentTitle.value = assignment.title;
    assignmentDescription.value = assignment.description;
    assignmentCourse.value = assignment.course;
    assignmentAssignedDate.value = assignment.assignedDate;
    assignmentDueDate.value = assignment.dueDate;

    document.getElementById("formHeading").textContent =
        "Edit Assignment";

    document.getElementById("saveAssignmentBtn").textContent =
        "Update Assignment";

    cancelEditBtn.hidden = false;

    clearErrors();
    showMessage("", "");

    document.getElementById("assignmentFormSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Delete assignment
function deleteAssignment(id) {
    const assignment = assignments.find(function (item) {
        return item.id === id;
    });

    if (!assignment) return;

    const confirmed = confirm(
        `Delete "${assignment.title}" and all its student submission records?`
    );

    if (!confirmed) return;

    assignments = assignments.filter(function (item) {
        return item.id !== id;
    });

    if (!saveAssignments()) return;

    renderAssignments();
    updateStatistics();

    showMessage("Assignment deleted successfully.", "success");
}

// Open submission modal
function openSubmissionModal(id) {
    const assignment = assignments.find(function (item) {
        return item.id === id;
    });

    if (!assignment) return;

    activeAssignmentId = id;

    document.getElementById("modalAssignmentTitle").textContent =
        assignment.title;

    document.getElementById("modalAssignmentCourse").textContent =
        `${assignment.course} · Due ${formatDate(assignment.dueDate)}`;

    renderSubmissions();

    submissionModal.hidden = false;
    document.body.style.overflow = "hidden";
}

// Close submission modal
function closeSubmissionModal() {
    submissionModal.hidden = true;
    document.body.style.overflow = "";
    activeAssignmentId = null;

    renderAssignments();
    updateStatistics();
}

document.getElementById("closeSubmissionModal")
    .addEventListener("click", closeSubmissionModal);

document.getElementById("doneSubmissionBtn")
    .addEventListener("click", closeSubmissionModal);

submissionModal.addEventListener("click", function (event) {
    if (event.target === submissionModal) {
        closeSubmissionModal();
    }
});

// Render individual student submissions
function renderSubmissions() {
    submissionTableBody.innerHTML = "";

    const assignment = assignments.find(function (item) {
        return item.id === activeAssignmentId;
    });

    if (!assignment) return;

    const courseStudents = getCourseStudents(assignment.course);

    let submitted = 0;
    let notSubmitted = 0;
    let late = 0;

    if (courseStudents.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-cell";
        cell.textContent =
            "No students are enrolled in this course. Add students first.";

        row.appendChild(cell);
        submissionTableBody.appendChild(row);
    }

    courseStudents.forEach(function (student) {
        const email = getStudentEmail(student);
        const submission = getSubmission(assignment, email);

        if (submission.status === "Submitted") submitted++;
        if (submission.status === "Not submitted") notSubmitted++;
        if (submission.status === "Late") late++;

        const row = document.createElement("tr");

        // Student details
        const studentCell = document.createElement("td");

        const name = document.createElement("strong");
        name.className = "assignment-title";
        name.textContent = student.name || "Unnamed student";

        const emailText = document.createElement("small");
        emailText.className = "student-email";
        emailText.textContent = email;

        studentCell.appendChild(name);
        studentCell.appendChild(emailText);

        row.appendChild(studentCell);

        // Submission status
        const statusCell = document.createElement("td");
        const statusSelect = document.createElement("select");

        ["Not submitted", "Submitted", "Late"].forEach(function (status) {
            const option = document.createElement("option");

            option.value = status;
            option.textContent = status;

            statusSelect.appendChild(option);
        });

        statusSelect.value = submission.status;
        statusSelect.className = "submission-status";

        statusCell.appendChild(statusSelect);
        row.appendChild(statusCell);

        // Marks
        const marksCell = document.createElement("td");
        const marksInput = document.createElement("input");

        marksInput.type = "number";
        marksInput.min = "0";
        marksInput.max = "100";
        marksInput.step = "0.5";
        marksInput.placeholder = "0–100";
        marksInput.value = submission.marks;
        marksInput.className = "submission-marks";
        marksInput.setAttribute("aria-label", "Marks out of 100");

        marksCell.appendChild(marksInput);
        row.appendChild(marksCell);

        // Feedback
        const feedbackCell = document.createElement("td");
        const feedbackInput = document.createElement("textarea");

        feedbackInput.placeholder = "Enter feedback";
        feedbackInput.value = submission.feedback;
        feedbackInput.className = "submission-feedback";
        feedbackInput.maxLength = 500;
        feedbackInput.setAttribute("aria-label", "Trainer feedback");

        feedbackCell.appendChild(feedbackInput);
        row.appendChild(feedbackCell);

        // Save button
        const actionCell = document.createElement("td");
        const saveButton = document.createElement("button");

        saveButton.type = "button";
        saveButton.className = "save-submission-btn";
        saveButton.textContent = "Save";

        saveButton.addEventListener("click", function () {
            saveStudentSubmission(
                assignment.id,
                email,
                statusSelect.value,
                marksInput.value,
                feedbackInput.value
            );
        });

        actionCell.appendChild(saveButton);
        row.appendChild(actionCell);

        submissionTableBody.appendChild(row);
    });

    document.getElementById("submissionSummary").innerHTML = "";

    [
        { text: `${submitted} Submitted` },
        { text: `${notSubmitted} Not submitted` },
        { text: `${late} Late` },
        { text: `${courseStudents.length} Students` }
    ].forEach(function (item) {
        const pill = document.createElement("span");

        pill.className = "summary-pill";
        pill.textContent = item.text;

        document.getElementById("submissionSummary").appendChild(pill);
    });
}

// Save an individual student's submission
function saveStudentSubmission(
    assignmentId,
    email,
    status,
    marksValue,
    feedback
) {
    const assignment = assignments.find(function (item) {
        return item.id === assignmentId;
    });

    if (!assignment) return;

    const marks = marksValue.trim();

    if (
        marks !== "" &&
        (!Number.isFinite(Number(marks)) ||
            Number(marks) < 0 ||
            Number(marks) > 100)
    ) {
        alert("Marks must be between 0 and 100.");
        return;
    }

    if (marks !== "" && status === "Not submitted") {
        alert("Change the submission status before entering marks.");
        return;
    }

    const previousSubmission = getSubmission(assignment, email);

    assignment.submissions[email] = {
        status: status,
        marks: marks === "" ? "" : Number(marks),
        feedback: feedback.trim(),
        submittedDate:
            status === "Not submitted"
                ? ""
                : (previousSubmission.submittedDate || getToday())
    };

    if (!saveAssignments()) return;

    renderSubmissions();
    renderAssignments();
    updateStatistics();
}

// Search, filters and sorting
assignmentSearch.addEventListener("input", function () {
    currentPage = 1;
    renderAssignments();
});

[filterCourse, filterStatus, assignmentSort].forEach(function (element) {
    element.addEventListener("change", function () {
        currentPage = 1;
        renderAssignments();
    });
});

// Pagination
previousPage.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        renderAssignments();
    }
});

nextPage.addEventListener("click", function () {
    currentPage++;
    renderAssignments();
});

// Keyboard escape closes modal
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !submissionModal.hidden) {
        closeSubmissionModal();
    }
});

// Initial page setup
loadCourseOptions();
migrateAssignments();

assignmentAssignedDate.value = getToday();
assignmentAssignedDate.max = getToday();
assignmentDueDate.min = getToday();

renderAssignments();
updateStatistics();

})();
