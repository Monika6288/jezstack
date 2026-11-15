
(function(){

// DOM Elements
const studentForm = document.getElementById("studentForm");
const studentFormSection = document.getElementById("studentFormSection");
const studentTableBody = document.getElementById("studentTableBody");
const studentMessage = document.getElementById("studentMessage");

const studentId = document.getElementById("studentId");
const studentName = document.getElementById("studentName");
const studentEmail = document.getElementById("studentEmail");
const studentPhone = document.getElementById("studentPhone");
const studentDOB = document.getElementById("studentDOB");
const studentCourse = document.getElementById("studentCourse");
const joiningDate = document.getElementById("joiningDate");
const studentStatus = document.getElementById("studentStatus");
const editingStudentId = document.getElementById("editingStudentId");

const studentSearch = document.getElementById("studentSearch");
const courseFilter = document.getElementById("courseFilter");
const statusFilter = document.getElementById("statusFilter");
const sortStudents = document.getElementById("sortStudents");

const previousPage = document.getElementById("previousPage");
const nextPage = document.getElementById("nextPage");

const pageSize = 5;
let currentPage = 1;
let messageTimer;

// Safe localStorage reading
function getStoredData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error("Storage error:", error);
        return fallback;
    }
}

// Load saved records
let students = getStoredData("students", []);
const courses = getStoredData("courses", []);

// Support older student records
students = students.map(function (student, index) {
    return {
        ...student,
        studentId: student.studentId || student.id || `OLD${String(index + 1).padStart(3, "0")}`,
        phone: student.phone || "",
        dob: student.dob || "",
        joiningDate: student.joiningDate || "",
        status: student.status || "Active"
    };
});

// Save students
function saveStudents() {
    localStorage.setItem("students", JSON.stringify(students));
}

// Show feedback
function showMessage(message, type) {
    studentMessage.textContent = message;
    studentMessage.className = "message-box " + type;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(function () {
        studentMessage.textContent = "";
        studentMessage.className = "message-box";
    }, 4000);
}

// Admin name
const adminProfile = getStoredData("adminProfile", null);
const adminName =
    adminProfile && adminProfile.name
        ? adminProfile.name
        : "Admin";

const sidebarName = document.getElementById("sidebarAdminName"); if (sidebarName) sidebarName.textContent = adminName;
const topName = document.getElementById("topAdminName"); if (topName) topName.textContent = adminName;

// Course dropdowns
function loadCourseOptions() {
    studentCourse.innerHTML = '<option value="">Select course</option>';
    courseFilter.innerHTML = '<option value="">All Courses</option>';

    courses.forEach(function (course) {
        const option1 = document.createElement("option");
        option1.value = course.name;
        option1.textContent = course.name;
        studentCourse.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = course.name;
        option2.textContent = course.name;
        courseFilter.appendChild(option2);
    });

    if (courses.length === 0) {
        studentCourse.innerHTML =
            '<option value="">Add a course first</option>';
    }
}

// Form display
function openStudentForm() {
    studentFormSection.classList.add("show");
    studentFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function closeStudentForm() {
    studentFormSection.classList.remove("show");
    studentForm.reset();
    editingStudentId.value = "";
    document.getElementById("formTitle").textContent = "Add New Student";
    document.getElementById("saveStudentBtn").textContent = "Save Student";
    clearErrors();
}

document.getElementById("showFormBtn").addEventListener("click", function () {
    studentForm.reset();
    editingStudentId.value = "";
    document.getElementById("formTitle").textContent = "Add New Student";
    document.getElementById("saveStudentBtn").textContent = "Save Student";
    clearErrors();
    openStudentForm();
});

document.getElementById("closeFormBtn").addEventListener("click", closeStudentForm);
document.getElementById("cancelFormBtn").addEventListener("click", closeStudentForm);

// Clear validation errors
function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (error) {
        error.textContent = "";
    });

    document.querySelectorAll("#studentForm input, #studentForm select")
        .forEach(function (field) {
            field.style.borderColor = "";
        });
}

// Display field error
function setFieldError(fieldId, message) {
    document.getElementById(fieldId + "Error").textContent = message;

    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = "#DC5252";
    }
}

// Validate form
function validateStudent(data) {
    clearErrors();

    let valid = true;

    if (!data.studentId.trim()) {
        setFieldError("studentId", "Student ID is required.");
        valid = false;
    }

    if (!/^[A-Za-z ]{2,60}$/.test(data.name)) {
        setFieldError("studentName", "Enter a valid name using letters and spaces.");
        valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(data.email)) {
        setFieldError("studentEmail", "Enter a valid email address.");
        valid = false;
    }

    const phoneDigits = data.phone.replace(/\D/g, "");

    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        setFieldError("studentPhone", "Enter a valid phone number.");
        valid = false;
    }

    if (!data.dob || data.dob > getToday()) {
        setFieldError("studentDOB", "Enter a valid date of birth.");
        valid = false;
    }

    if (!data.course) {
        setFieldError("studentCourse", "Please select a course.");
        valid = false;
    }

    if (!data.joiningDate || data.joiningDate > getToday()) {
        setFieldError("joiningDate", "Enter a valid joining date.");
        valid = false;
    }

    if (data.dob && data.joiningDate && data.joiningDate < data.dob) {
        setFieldError("joiningDate", "Joining date cannot be before date of birth.");
        valid = false;
    }

    // Unique Student ID
    const duplicateId = students.some(function (student) {
        return (
            student.studentId.toLowerCase() === data.studentId.toLowerCase() &&
            student.studentId !== editingStudentId.value
        );
    });

    if (duplicateId) {
        setFieldError("studentId", "This Student ID already exists.");
        valid = false;
    }

    // Unique email
    const duplicateEmail = students.some(function (student) {
        return (
            student.email.toLowerCase() === data.email.toLowerCase() &&
            student.studentId !== editingStudentId.value
        );
    });

    if (duplicateEmail) {
        setFieldError("studentEmail", "This email is already registered.");
        valid = false;
    }

    return valid;
}

// Get today's date in YYYY-MM-DD format
function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Form submit: Add or Edit
studentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = {
        studentId: studentId.value.trim(),
        name: studentName.value.trim(),
        email: studentEmail.value.trim().toLowerCase(),
        phone: studentPhone.value.trim(),
        dob: studentDOB.value,
        course: studentCourse.value,
        joiningDate: joiningDate.value,
        status: studentStatus.value
    };

    if (!validateStudent(data)) {
        showMessage("Please correct the errors in the form.", "error");
        return;
    }

    // Edit existing student
    if (editingStudentId.value) {
        const index = students.findIndex(function (student) {
            return student.studentId === editingStudentId.value;
        });

        if (index !== -1) {
            students[index] = {
                ...students[index],
                ...data
            };

            saveStudents();
            renderStudents();
            updateStatistics();
            closeStudentForm();
            showMessage("Student details updated successfully.", "success");
        }

    } else {
        // Add new student
        students.push(data);

        saveStudents();
        renderStudents();
        updateStatistics();
        closeStudentForm();
        showMessage("Student added successfully.", "success");
    }
});

// Edit student
function editStudent(id) {
    const student = students.find(function (item) {
        return item.studentId === id;
    });

    if (!student) return;

    editingStudentId.value = student.studentId;

    studentId.value = student.studentId;
    studentName.value = student.name;
    studentEmail.value = student.email;
    studentPhone.value = student.phone;
    studentDOB.value = student.dob;
    studentCourse.value = student.course;
    joiningDate.value = student.joiningDate;
    studentStatus.value = student.status;

    document.getElementById("formTitle").textContent = "Edit Student";
    document.getElementById("saveStudentBtn").textContent = "Update Student";

    clearErrors();
    openStudentForm();
}

// Delete student
function deleteStudent(id) {
    const student = students.find(function (item) {
        return item.studentId === id;
    });

    if (!student) return;

    const confirmed = confirm(
        `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) return;

    students = students.filter(function (item) {
        return item.studentId !== id;
    });

    saveStudents();
    renderStudents();
    updateStatistics();

    showMessage("Student deleted successfully.", "success");
}

// Format date
function formatDate(date) {
    if (!date) return "—";

    const parts = date.split("-");
    if (parts.length !== 3) return date;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Create safe table cell
function createCell(value, className) {
    const cell = document.createElement("td");
    cell.textContent = value || "—";

    if (className) {
        cell.className = className;
    }

    return cell;
}

// Render student table
function renderStudents() {
    studentTableBody.innerHTML = "";

    const searchValue = studentSearch.value.trim().toLowerCase();
    const selectedCourse = courseFilter.value;
    const selectedStatus = statusFilter.value;

    let filteredStudents = students.filter(function (student) {
        const matchesSearch =
            student.name.toLowerCase().includes(searchValue) ||
            student.email.toLowerCase().includes(searchValue) ||
            student.studentId.toLowerCase().includes(searchValue);

        const matchesCourse =
            !selectedCourse || student.course === selectedCourse;

        const matchesStatus =
            !selectedStatus || student.status === selectedStatus;

        return matchesSearch && matchesCourse && matchesStatus;
    });

    // Sorting
    const sortValue = sortStudents.value;

    filteredStudents.sort(function (a, b) {
        switch (sortValue) {
            case "name-desc":
                return b.name.localeCompare(a.name);

            case "date-new":
                return (b.joiningDate || "").localeCompare(a.joiningDate || "");

            case "date-old":
                return (a.joiningDate || "").localeCompare(b.joiningDate || "");

            case "id-asc":
                return a.studentId.localeCompare(b.studentId);

            case "id-desc":
                return b.studentId.localeCompare(a.studentId);

            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const visibleStudents = filteredStudents.slice(
        startIndex,
        startIndex + pageSize
    );

    // Empty state
    if (visibleStudents.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.className = "empty-cell";
        cell.textContent = students.length === 0
            ? "No students added yet. Click Add Student to get started."
            : "No students match your search or filters.";

        row.appendChild(cell);
        studentTableBody.appendChild(row);
    }

    // Table rows
    visibleStudents.forEach(function (student) {
        const row = document.createElement("tr");

        row.appendChild(createCell(student.studentId, "student-id"));

        const detailsCell = document.createElement("td");

        const name = document.createElement("span");
        name.className = "student-name";
        name.textContent = student.name;

        const email = document.createElement("span");
        email.className = "student-email";
        email.textContent = student.email;

        detailsCell.appendChild(name);
        detailsCell.appendChild(email);

        row.appendChild(detailsCell);
        row.appendChild(createCell(student.phone));
        row.appendChild(createCell(student.course));
        row.appendChild(createCell(formatDate(student.joiningDate)));

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = "status-badge status-" +
            student.status.toLowerCase();

        badge.textContent = student.status;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        // Action buttons
        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "action-buttons";

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "action-btn view-btn";
        viewButton.textContent = "View";

        viewButton.addEventListener("click", function () {
            if (window.displayStudentDetails) window.displayStudentDetails(student.email);
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editStudent(student.studentId);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteStudent(student.studentId);
        });

        actions.appendChild(viewButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        studentTableBody.appendChild(row);
    });

    // Pagination information
    document.getElementById("recordCount").textContent =
        filteredStudents.length + " records";

    document.getElementById("paginationInfo").textContent =
        filteredStudents.length === 0
            ? "Showing 0 students"
            : `Showing ${startIndex + 1} to ${Math.min(
                startIndex + pageSize,
                filteredStudents.length
            )} of ${filteredStudents.length} students`;

    document.getElementById("pageNumber").textContent =
        `${currentPage} / ${totalPages}`;

    previousPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

// Statistics
function updateStatistics() {
    document.getElementById("totalStudentCount").textContent =
        students.length;

    document.getElementById("activeStudentCount").textContent =
        students.filter(s => s.status === "Active").length;

    document.getElementById("inactiveStudentCount").textContent =
        students.filter(s => s.status === "Inactive").length;

    document.getElementById("completedStudentCount").textContent =
        students.filter(s => s.status === "Completed").length;
}

// Search, filters and sorting
studentSearch.addEventListener("input", function () {
    currentPage = 1;
    renderStudents();
});

courseFilter.addEventListener("change", function () {
    currentPage = 1;
    renderStudents();
});

statusFilter.addEventListener("change", function () {
    currentPage = 1;
    renderStudents();
});

sortStudents.addEventListener("change", function () {
    currentPage = 1;
    renderStudents();
});

// Pagination buttons
previousPage.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        renderStudents();
    }
});

nextPage.addEventListener("click", function () {
    currentPage++;
    renderStudents();
});

// Initial loading
loadCourseOptions();
updateStatistics();
renderStudents();



// Open edit form when redirected from Student Details page
window.editStudentFromDetails = function(id){ editStudent(id); };

})();
