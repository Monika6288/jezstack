(function(){
const section = document.getElementById("courses");

function el(id) {
    return section.querySelector("#" + id) || document.getElementById(id);
}

// DOM Elements
const courseForm = el("courseForm");
const courseFormSection = el("courseFormSection");
const courseTableBody = el("courseTableBody");
const courseMessage = el("courseMessage");

const courseId = el("courseId");
const courseName = el("courseName");
const courseDescription = el("courseDescription");
const courseDuration = el("courseDuration");
const courseFee = el("courseFee");
const courseStatus = el("courseStatus");
const courseTrainer = el("courseTrainer");
const editingCourseId = el("editingCourseId");

const courseSearch = el("courseSearch");
const courseStatusFilter = el("courseStatusFilter");
const courseSort = el("courseSort");

const previousPage = el("previousPage");
const nextPage = el("nextPage");

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

// Make old course records compatible
function normalizeCourses(list) {
    return list.map(function (course, index) {
    const assignedTrainers = Array.isArray(course.trainers)
            ? course.trainers
            : (course.trainer ? [course.trainer] : []);

        return {
            ...course,
            id: course.id || course.courseId ||
                `OLD${String(index + 1).padStart(3, "0")}`,
            description: course.description || "No description provided",
            fee: Number(course.fee) || 0,
            status: course.status || "Active",
            trainers: assignedTrainers,
            trainer: course.trainer || assignedTrainers[0] || ""
        };
    });
}

// Load existing records
let courses = normalizeCourses(getStoredData("courses", []));
let trainers = getStoredData("trainers", []);
let students = getStoredData("students", []);

// Re-read data saved by the other sections (Trainers, Students, ...).
// Without this the Courses section works with stale copies and can
// overwrite changes made elsewhere.
function refreshData() {
    courses = normalizeCourses(getStoredData("courses", []));
    trainers = getStoredData("trainers", []);
    students = getStoredData("students", []);
}

// Save courses
function saveCourses() {
    localStorage.setItem("courses", JSON.stringify(courses));
}

// Admin profile
const adminProfile = getStoredData("adminProfile", null);
const adminName = adminProfile && adminProfile.name
    ? adminProfile.name
    : "Admin";

const sidebarName = el("sidebarAdminName"); if (sidebarName) sidebarName.textContent = adminName;
const topName = el("topAdminName"); if (topName) topName.textContent = adminName;

// Show feedback
function showMessage(message, type) {
    const formMessage = el("courseMessage");
    const listMessage = el("courseListMessage");

    [formMessage, listMessage].forEach(function (element) {
        element.textContent = message;
        element.className = "message-box " + type;
    });

    clearTimeout(messageTimer);

    messageTimer = setTimeout(function () {
        [formMessage, listMessage].forEach(function (element) {
            element.textContent = "";
            element.className = "message-box";
        });
    }, 4000);
}

// Clear form errors
function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (element) {
        element.textContent = "";
    });

    document.querySelectorAll("#courseForm input, #courseForm textarea, #courseForm select")
        .forEach(function (field) {
            field.style.borderColor = "";
        });
}

// Show field error
function setFieldError(fieldId, message) {
    el(fieldId + "Error").textContent = message;

    const field = el(fieldId);

    if (field) {
        field.style.borderColor = "#DC5252";
    }
}

// Load trainer options
function loadTrainerOptions(selectedNames = []) {
    courseTrainer.innerHTML = "";

    trainers.forEach(function (trainer) {
        const option = document.createElement("option");

        option.value = trainer.name;
        option.textContent = trainer.name +
            (trainer.subject ? " (" + trainer.subject + ")" : "");

        option.selected = selectedNames.includes(trainer.name);

        courseTrainer.appendChild(option);
    });

    if (trainers.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No trainers available. Add a trainer first.";
        option.disabled = true;
        courseTrainer.appendChild(option);
    }
}

// Get selected trainers
function getSelectedTrainers() {
    return Array.from(courseTrainer.selectedOptions)
        .map(function (option) {
            return option.value;
        })
        .filter(Boolean);
}

// Get students enrolled in a course
function getEnrolledStudents(course) {
    return students.filter(function (student) {
        return student.course === course.name;
    });
}

// Get course trainers
function getCourseTrainers(course) {
    if (Array.isArray(course.trainers)) {
        return course.trainers;
    }

    return course.trainer ? [course.trainer] : [];
}

// Update summary cards
function updateStatistics() {
    const totalEnrolments = courses.reduce(function (total, course) {
        return total + getEnrolledStudents(course).length;
    }, 0);

    const trainerNames = new Set();

    courses.forEach(function (course) {
        getCourseTrainers(course).forEach(function (name) {
            trainerNames.add(name);
        });
    });

    el("totalCourses").textContent =
        courses.length;

    el("activeCourses").textContent =
        courses.filter(function (course) {
            return course.status === "Active";
        }).length;

    el("totalEnrolments").textContent =
        totalEnrolments;

    el("assignedTrainers").textContent =
        trainerNames.size;
}

// Open course form
function openCourseForm() {
    courseFormSection.hidden = false;

    courseFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Reset form
function resetCourseForm() {
    courseForm.reset();
    editingCourseId.value = "";

    loadTrainerOptions();

    el("formTitle").textContent =
        "Add New Course";

    el("saveCourseBtn").textContent =
        "Save Course";

    clearErrors();
    courseMessage.textContent = "";
    courseMessage.className = "message-box";
}

// Close form
function closeCourseForm() {
    courseFormSection.hidden = true;
    resetCourseForm();
}

el("showFormBtn").addEventListener("click", function () {
    refreshData();
    resetCourseForm();
    openCourseForm();
});

el("closeFormBtn").addEventListener("click", closeCourseForm);
el("cancelFormBtn").addEventListener("click", closeCourseForm);

// Validate course
function validateCourse(data) {
    clearErrors();

    let valid = true;

    if (!data.id.trim()) {
        setFieldError("courseId", "Course ID is required.");
        valid = false;
    }

    if (!/^[A-Za-z0-9_-]{2,20}$/.test(data.id)) {
        setFieldError("courseId", "Use 2–20 letters, numbers, hyphens or underscores.");
        valid = false;
    }

    if (!/^[A-Za-z0-9 .&()_-]{2,80}$/.test(data.name)) {
        setFieldError("courseName", "Enter a valid course name.");
        valid = false;
    }

    if (data.description.length < 5) {
        setFieldError("courseDescription", "Enter at least 5 characters.");
        valid = false;
    }

    if (!data.duration.trim()) {
        setFieldError("courseDuration", "Duration is required.");
        valid = false;
    }

    if (data.fee === "" || !Number.isFinite(Number(data.fee)) ||
        Number(data.fee) < 0) {
        setFieldError("courseFee", "Enter a valid course fee.");
        valid = false;
    }

    if (data.trainers.length === 0) {
        setFieldError("courseTrainer", "Select at least one trainer.");
        valid = false;
    }

    const duplicateId = courses.some(function (course) {
        return course.id.toLowerCase() === data.id.toLowerCase() &&
            course.id !== editingCourseId.value;
    });

    if (duplicateId) {
        setFieldError("courseId", "This Course ID already exists.");
        valid = false;
    }

    const duplicateName = courses.some(function (course) {
        return course.name.toLowerCase() === data.name.toLowerCase() &&
            course.id !== editingCourseId.value;
    });

    if (duplicateName) {
        setFieldError("courseName", "This course name already exists.");
        valid = false;
    }

    return valid;
}

// Add or update course
courseForm.addEventListener("submit", function (event) {
    event.preventDefault();
    refreshData();

    const data = {
        id: courseId.value.trim(),
        name: courseName.value.trim(),
        description: courseDescription.value.trim(),
        duration: courseDuration.value.trim(),
        fee: Number(courseFee.value),
        status: courseStatus.value,
        trainers: getSelectedTrainers()
    };

    if (!validateCourse(data)) {
        showMessage("Please correct the errors in the form.", "error");
        return;
    }

    // Keep old trainer property for compatibility
    const courseData = {
        ...data,
        trainer: data.trainers[0]
    };

    if (editingCourseId.value) {
        const index = courses.findIndex(function (course) {
            return course.id === editingCourseId.value;
        });

        if (index !== -1) {
            courses[index] = {
                ...courses[index],
                ...courseData
            };

            saveCourses();
            renderCourses();
            updateStatistics();
            closeCourseForm();

            showMessage("Course updated successfully.", "success");
        }
    } else {
        courses.push(courseData);

        saveCourses();
        renderCourses();
        updateStatistics();
        closeCourseForm();

        showMessage("Course added successfully.", "success");
    }
});

// Edit course
function editCourse(id) {
    refreshData();

    const course = courses.find(function (item) {
        return item.id === id;
    });

    if (!course) return;

    editingCourseId.value = course.id;

    courseId.value = course.id;
    courseName.value = course.name;
    courseDescription.value = course.description;
    courseDuration.value = course.duration;
    courseFee.value = course.fee;
    courseStatus.value = course.status;

    loadTrainerOptions(getCourseTrainers(course));

    el("formTitle").textContent = "Edit Course";
    el("saveCourseBtn").textContent = "Update Course";

    clearErrors();
    openCourseForm();
}

// Delete course
function deleteCourse(id) {
    refreshData();

    const course = courses.find(function (item) {
        return item.id === id;
    });

    if (!course) return;

    const enrolled = getEnrolledStudents(course);

    if (enrolled.length > 0) {
        alert(
            `Cannot delete "${course.name}". ${enrolled.length} student(s) are still enrolled. Reassign those students first.`
        );
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete the course "${course.name}"?`
    );

    if (!confirmed) return;

    courses = courses.filter(function (item) {
        return item.id !== id;
    });

    saveCourses();
    renderCourses();
    updateStatistics();

    showMessage("Course deleted successfully.", "success");
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

// View course details
function viewCourse(id) {
    const course = courses.find(function (item) {
        return item.id === id;
    });

    if (!course) return;

    const enrolled = getEnrolledStudents(course);
    const assignedTrainers = getCourseTrainers(course);

    const details = [
        { label: "Course ID", value: course.id },
        { label: "Course Name", value: course.name },
        { label: "Duration", value: course.duration },
        {
            label: "Course Fee",
            value: "₹" + Number(course.fee || 0).toLocaleString("en-IN")
        },
        { label: "Status", value: course.status },
        { label: "Assigned Trainer(s)", value: assignedTrainers.join(", ") || "Not assigned" },
        { label: "Enrolled Students", value: String(enrolled.length) },
        { label: "Description", value: course.description, full: true }
    ];

    const content = el("courseViewContent");
    content.innerHTML = "";

    details.forEach(function (item) {
        const wrapper = document.createElement("div");
        wrapper.className = "modal-detail-item" +
            (item.full ? " full-width" : "");

        const label = document.createElement("span");
        label.textContent = item.label;

        const value = document.createElement("strong");
        value.textContent = item.value || "—";

        wrapper.appendChild(label);
        wrapper.appendChild(value);
        content.appendChild(wrapper);
    });

    el("courseViewModal").hidden = false;
}

// Close modal
function closeCourseModal() {
    el("courseViewModal").hidden = true;
}

el("closeViewModal").addEventListener("click", closeCourseModal);
el("modalCloseBtn").addEventListener("click", closeCourseModal);

el("courseViewModal").addEventListener("click", function (event) {
    if (event.target === this) {
        closeCourseModal();
    }
});

// Render course list
function renderCourses() {
    courseTableBody.innerHTML = "";

    const searchValue = courseSearch.value.trim().toLowerCase();
    const selectedStatus = courseStatusFilter.value;

    let filteredCourses = courses.filter(function (course) {
        const matchesSearch =
            course.name.toLowerCase().includes(searchValue) ||
            course.id.toLowerCase().includes(searchValue);

        const matchesStatus =
            !selectedStatus || course.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Sorting
    filteredCourses.sort(function (a, b) {
        switch (courseSort.value) {
            case "name-desc":
                return b.name.localeCompare(a.name);

            case "fee-low":
                return Number(a.fee) - Number(b.fee);

            case "fee-high":
                return Number(b.fee) - Number(a.fee);

            case "students-high":
                return getEnrolledStudents(b).length -
                    getEnrolledStudents(a).length;

            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Pagination
    const totalPages = Math.max(
        1,
        Math.ceil(filteredCourses.length / pageSize)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * pageSize;

    const visibleCourses = filteredCourses.slice(
        startIndex,
        startIndex + pageSize
    );

    if (visibleCourses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.className = "empty-cell";
        cell.textContent = courses.length === 0
            ? "No courses added yet. Click Add Course to get started."
            : "No courses match your search or filter.";

        row.appendChild(cell);
        courseTableBody.appendChild(row);
    }

    visibleCourses.forEach(function (course) {
        const row = document.createElement("tr");

        row.appendChild(createCell(course.id, "course-id"));

        // Course name and description
        const detailsCell = document.createElement("td");

        const name = document.createElement("span");
        name.className = "course-name";
        name.textContent = course.name;

        const description = document.createElement("span");
        description.className = "course-description";
        description.textContent = course.description;

        detailsCell.appendChild(name);
        detailsCell.appendChild(description);
        row.appendChild(detailsCell);

        row.appendChild(createCell(course.duration));

        row.appendChild(createCell(
            "₹" + Number(course.fee || 0).toLocaleString("en-IN")
        ));

        const trainerCell = createCell(
            getCourseTrainers(course).join(", "),
            "trainer-list"
        );
        row.appendChild(trainerCell);

        const enrolledCount = getEnrolledStudents(course).length;
        const enrolmentCell = document.createElement("td");

        const enrolmentBadge = document.createElement("span");
        enrolmentBadge.className = "enrolment-count";
        enrolmentBadge.textContent = enrolledCount;

        enrolmentCell.appendChild(enrolmentBadge);
        row.appendChild(enrolmentCell);

        // Status
        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className = "course-status status-" +
            course.status.toLowerCase();

        statusBadge.textContent = course.status;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Actions
        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "action-buttons";

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "action-btn view-btn";
        viewButton.textContent = "View";
        viewButton.addEventListener("click", function () {
            viewCourse(course.id);
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            editCourse(course.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            deleteCourse(course.id);
        });

        actions.appendChild(viewButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        courseTableBody.appendChild(row);
    });

    // Pagination information
    el("courseRecordCount").textContent =
        filteredCourses.length + " courses";

    el("paginationInfo").textContent =
        filteredCourses.length === 0
            ? "Showing 0 courses"
            : `Showing ${startIndex + 1} to ${Math.min(
                startIndex + pageSize,
                filteredCourses.length
            )} of ${filteredCourses.length} courses`;

    el("pageNumber").textContent =
        `${currentPage} / ${totalPages}`;

    previousPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

// Search, filter and sort
courseSearch.addEventListener("input", function () {
    currentPage = 1;
    renderCourses();
});

courseStatusFilter.addEventListener("change", function () {
    currentPage = 1;
    renderCourses();
});

courseSort.addEventListener("change", function () {
    currentPage = 1;
    renderCourses();
});

// Pagination
previousPage.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        renderCourses();
    }
});

nextPage.addEventListener("click", function () {
    currentPage++;
    renderCourses();
});

// Initial page loading
loadTrainerOptions();
updateStatistics();
renderCourses();

// Refresh the list, counts and trainer options each time the section is shown
new MutationObserver(function () {
    if (!section.classList.contains("active-section")) return;

    refreshData();

    if (courseFormSection.hidden) {
        loadTrainerOptions();
    }

    updateStatistics();
    renderCourses();
}).observe(section, { attributes: true, attributeFilter: ["class"] });

})();