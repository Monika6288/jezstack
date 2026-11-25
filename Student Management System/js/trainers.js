(function(){
const section = document.getElementById("trainers");

function el(id) {
    return section.querySelector("#" + id) || document.getElementById(id);
}

// DOM elements
const trainerForm = el("trainerForm");
const trainerFormSection = el("trainerFormSection");
const trainerTableBody = el("trainerTableBody");
const trainerMessage = el("trainerMessage");
const trainerListMessage = el("trainerListMessage");

const trainerId = el("trainerId");
const trainerName = el("trainerName");
const trainerEmail = el("trainerEmail");
const trainerPhone = el("trainerPhone");
const trainerExpertise = el("trainerExpertise");
const trainerStatus = el("trainerStatus");
const trainerCourses = el("trainerCourses");
const editingTrainerId = el("editingTrainerId");

const trainerSearch = el("trainerSearch");
const trainerStatusFilter = el("trainerStatusFilter");
const trainerSort = el("trainerSort");

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

// Generate IDs for old trainer records
function normalizeTrainers(list) {
    return list.map(function (trainer, index) {
        return {
            ...trainer,
            id: trainer.id || trainer.trainerId ||
                `OLDTRN${String(index + 1).padStart(3, "0")}`,
            phone: trainer.phone || "",
            expertise: trainer.expertise || trainer.subject || "Not specified",
            subject: trainer.subject || trainer.expertise || "Not specified",
            status: trainer.status || "Active",
            courses: Array.isArray(trainer.courses) ? trainer.courses : []
        };
    });
}

// Generate IDs for old course records
function normalizeCourses(list) {
    return list.map(function (course, index) {
        return {
            ...course,
            id: course.id || course.courseId ||
                `OLDCRS${String(index + 1).padStart(3, "0")}`
        };
    });
}

// Load existing data
let trainers = normalizeTrainers(getStoredData("trainers", []));
let courses = normalizeCourses(getStoredData("courses", []));
let students = getStoredData("students", []);

// Re-read data saved by the other sections (Courses, Students, ...).
// Without this the Trainers section works with stale copies and can
// overwrite courses added in the Courses section.
function refreshData() {
    trainers = normalizeTrainers(getStoredData("trainers", []));
    courses = normalizeCourses(getStoredData("courses", []));
    students = getStoredData("students", []);
}

// Save data
function saveTrainers() {
    localStorage.setItem("trainers", JSON.stringify(trainers));
}

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

// Messages
function showMessage(message, type) {
    [trainerMessage, trainerListMessage].forEach(function (element) {
        element.textContent = message;
        element.className = "message-box " + type;
    });

    clearTimeout(messageTimer);

    messageTimer = setTimeout(function () {
        [trainerMessage, trainerListMessage].forEach(function (element) {
            element.textContent = "";
            element.className = "message-box";
        });
    }, 4000);
}

// Clear validation errors
function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (element) {
        element.textContent = "";
    });

    document.querySelectorAll("#trainerForm input, #trainerForm select")
        .forEach(function (field) {
            field.style.borderColor = "";
        });
}

// Show a field error
function setFieldError(fieldId, message) {
    el(fieldId + "Error").textContent = message;

    const field = el(fieldId);

    if (field) {
        field.style.borderColor = "#DC5252";
    }
}

// Get the courses currently assigned to a trainer
function getTrainerCourseIds(trainer) {
    const assignedIds = new Set(
        Array.isArray(trainer.courses) ? trainer.courses : []
    );

    // Also read course records for compatibility with older data.
    courses.forEach(function (course) {
        const courseTrainerNames = Array.isArray(course.trainers)
            ? course.trainers
            : (course.trainer ? [course.trainer] : []);

        if (
            courseTrainerNames.includes(trainer.id) ||
            courseTrainerNames.includes(trainer.name) ||
            courseTrainerNames.includes(trainer.email)
        ) {
            assignedIds.add(course.id);
        }
    });

    return Array.from(assignedIds);
}

// Find courses handled by a trainer
function getTrainerCourses(trainer) {
    const assignedIds = getTrainerCourseIds(trainer);

    return courses.filter(function (course) {
        return assignedIds.includes(course.id);
    });
}

// Populate course options
function loadCourseOptions(selectedIds = []) {
    trainerCourses.innerHTML = "";

    courses.forEach(function (course) {
        const option = document.createElement("option");

        option.value = course.id;
        option.textContent = course.name;
        option.selected = selectedIds.includes(course.id);

        trainerCourses.appendChild(option);
    });

    if (courses.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No courses yet. You can assign this trainer later when adding a course.";
        option.disabled = true;

        trainerCourses.appendChild(option);
    }
}

// Get selected course IDs
function getSelectedCourseIds() {
    return Array.from(trainerCourses.selectedOptions)
        .map(function (option) {
            return option.value;
        })
        .filter(Boolean);
}

// Synchronise trainer assignments with course records.
// The Courses module stores trainer names in its trainers array.
function syncTrainerCourseAssignments(trainer, selectedCourseIds) {
    const oldName = trainer.name;
    const newName = trainerName.value.trim();
    const newEmail = trainerEmail.value.trim();

    courses.forEach(function (course) {
        let assignedTrainers = Array.isArray(course.trainers)
            ? [...course.trainers]
            : (course.trainer ? [course.trainer] : []);

        // Remove the old name/email/id from all course assignments.
        assignedTrainers = assignedTrainers.filter(function (name) {
            return name !== oldName && name !== trainer.email && name !== trainer.id;
        });

        // Add the trainer to selected courses.
        if (selectedCourseIds.includes(course.id)) {
            if (!assignedTrainers.includes(trainer.id) && !assignedTrainers.includes(newName)) {
                assignedTrainers.push(trainer.id || newName);
            }
        }

        course.trainers = assignedTrainers;
        course.trainer = assignedTrainers[0] || "";
    });

    trainer.name = newName;
    trainer.email = newEmail;
    trainer.courses = selectedCourseIds;
}

// Update summary cards
function updateStatistics() {
    const activeCount = trainers.filter(function (trainer) {
        return trainer.status === "Active";
    }).length;

    const assignedCourseIds = new Set();

    trainers.forEach(function (trainer) {
        getTrainerCourses(trainer).forEach(function (course) {
            assignedCourseIds.add(course.id);
        });
    });

    const expertiseAreas = new Set();

    trainers.forEach(function (trainer) {
        expertiseAreas.add(trainer.expertise.trim().toLowerCase());
    });

    el("totalTrainers").textContent =
        trainers.length;

    el("activeTrainers").textContent =
        activeCount;

    el("assignedCourses").textContent =
        assignedCourseIds.size;

    el("expertiseCount").textContent =
        expertiseAreas.size;
}

// Open form
function openTrainerForm() {
    trainerFormSection.hidden = false;

    trainerFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Reset form
function resetTrainerForm() {
    trainerForm.reset();
    editingTrainerId.value = "";

    loadCourseOptions();

    el("formTitle").textContent =
        "Add New Trainer";

    el("saveTrainerBtn").textContent =
        "Save Trainer";

    clearErrors();
    trainerMessage.textContent = "";
}

// Close form
function closeTrainerForm() {
    trainerFormSection.hidden = true;
    resetTrainerForm();
}

el("showFormBtn").addEventListener("click", function () {
    refreshData();
    resetTrainerForm();
    openTrainerForm();
});

el("closeFormBtn").addEventListener("click", closeTrainerForm);
el("cancelFormBtn").addEventListener("click", closeTrainerForm);

// Validation
function validateTrainer(data) {
    clearErrors();

    let valid = true;

    if (!data.id) {
        setFieldError("trainerId", "Trainer ID is required.");
        valid = false;
    } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(data.id)) {
        setFieldError(
            "trainerId",
            "Use 2–20 letters, numbers, hyphens or underscores."
        );
        valid = false;
    }

    if (!/^[A-Za-z ]{2,60}$/.test(data.name)) {
        setFieldError(
            "trainerName",
            "Enter a valid name using letters and spaces."
        );
        valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setFieldError("trainerEmail", "Enter a valid email address.");
        valid = false;
    }

    if (!/^[0-9+\-\s()]{7,18}$/.test(data.phone)) {
        setFieldError("trainerPhone", "Enter a valid phone number.");
        valid = false;
    }

    if (data.expertise.length < 2) {
        setFieldError("trainerExpertise", "Enter the trainer's expertise.");
        valid = false;
    }

    const currentId = editingTrainerId.value;

    const duplicateId = trainers.some(function (trainer) {
        return trainer.id.toLowerCase() === data.id.toLowerCase() &&
            trainer.id !== currentId;
    });

    if (duplicateId) {
        setFieldError("trainerId", "This Trainer ID already exists.");
        valid = false;
    }

    const duplicateEmail = trainers.some(function (trainer) {
        return trainer.email.toLowerCase() === data.email.toLowerCase() &&
            trainer.id !== currentId;
    });

    if (duplicateEmail) {
        setFieldError("trainerEmail", "This email is already registered.");
        valid = false;
    }

    return valid;
}

// Add or update trainer
trainerForm.addEventListener("submit", function (event) {
    event.preventDefault();
    refreshData();

    const data = {
        id: trainerId.value.trim(),
        name: trainerName.value.trim(),
        email: trainerEmail.value.trim(),
        phone: trainerPhone.value.trim(),
        expertise: trainerExpertise.value.trim(),
        status: trainerStatus.value,
        courses: getSelectedCourseIds()
    };

    if (!validateTrainer(data)) {
        showMessage("Please correct the errors in the form.", "error");
        return;
    }

    if (editingTrainerId.value) {
        const index = trainers.findIndex(function (trainer) {
            return trainer.id === editingTrainerId.value;
        });

        if (index === -1) return;

        const oldTrainer = trainers[index];

        const updatedTrainer = {
            ...oldTrainer,
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            expertise: data.expertise,
            subject: data.expertise,
            status: data.status,
            courses: data.courses
        };

        // Update course relationships using the old trainer identity.
        syncTrainerCourseAssignments(oldTrainer, data.courses);

        // Apply the new ID and remaining details.
        trainers[index] = {
            ...updatedTrainer,
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            expertise: data.expertise,
            subject: data.expertise,
            status: data.status,
            courses: data.courses
        };

        saveTrainers();
        saveCourses();

        renderTrainers();
        updateStatistics();
        closeTrainerForm();

        showMessage("Trainer updated successfully.", "success");

    } else {
        const newTrainer = {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            expertise: data.expertise,
            subject: data.expertise,
            status: data.status,
            courses: data.courses
        };

        trainers.push(newTrainer);

        syncTrainerCourseAssignments(newTrainer, data.courses);

        saveTrainers();
        saveCourses();

        renderTrainers();
        updateStatistics();
        closeTrainerForm();

        showMessage("Trainer added successfully.", "success");
    }
});

// Edit trainer
function editTrainer(id) {
    refreshData();

    const trainer = trainers.find(function (item) {
        return item.id === id;
    });

    if (!trainer) return;

    editingTrainerId.value = trainer.id;

    trainerId.value = trainer.id;
    trainerName.value = trainer.name;
    trainerEmail.value = trainer.email;
    trainerPhone.value = trainer.phone;
    trainerExpertise.value = trainer.expertise;
    trainerStatus.value = trainer.status;

    loadCourseOptions(getTrainerCourseIds(trainer));

    el("formTitle").textContent =
        "Edit Trainer";

    el("saveTrainerBtn").textContent =
        "Update Trainer";

    clearErrors();
    openTrainerForm();
}

// Delete trainer
function deleteTrainer(id) {
    refreshData();

    const trainer = trainers.find(function (item) {
        return item.id === id;
    });

    if (!trainer) return;

    const assignedCourses = getTrainerCourses(trainer);

    if (assignedCourses.length > 0) {
        alert(
            `Cannot delete ${trainer.name}. This trainer is assigned to ${assignedCourses.length} course(s). Reassign those courses first.`
        );
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete trainer "${trainer.name}"?`
    );

    if (!confirmed) return;

    trainers = trainers.filter(function (item) {
        return item.id !== id;
    });

    saveTrainers();
    renderTrainers();
    updateStatistics();

    showMessage("Trainer deleted successfully.", "success");
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

// View trainer
function viewTrainer(id) {
    const trainer = trainers.find(function (item) {
        return item.id === id;
    });

    if (!trainer) return;

    const assignedCourses = getTrainerCourses(trainer);

    const details = [
        { label: "Trainer ID", value: trainer.id },
        { label: "Full Name", value: trainer.name },
        { label: "Email Address", value: trainer.email },
        { label: "Phone Number", value: trainer.phone },
        { label: "Expertise", value: trainer.expertise },
        { label: "Status", value: trainer.status },
        {
            label: "Assigned Courses",
            value: assignedCourses.map(function (course) {
                return course.name;
            }).join(", ") || "No courses assigned",
            full: true
        }
    ];

    const content = el("trainerViewContent");
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

    el("trainerViewModal").hidden = false;
}

// Close details modal
function closeTrainerModal() {
    el("trainerViewModal").hidden = true;
}

el("closeViewModal").addEventListener("click", closeTrainerModal);
el("modalCloseBtn").addEventListener("click", closeTrainerModal);

el("trainerViewModal").addEventListener("click", function (event) {
    if (event.target === this) {
        closeTrainerModal();
    }
});

// Render trainer table
function renderTrainers() {
    trainerTableBody.innerHTML = "";

    const searchValue = trainerSearch.value.trim().toLowerCase();
    const selectedStatus = trainerStatusFilter.value;

    let filteredTrainers = trainers.filter(function (trainer) {
        const matchesSearch =
            trainer.name.toLowerCase().includes(searchValue) ||
            trainer.email.toLowerCase().includes(searchValue) ||
            trainer.id.toLowerCase().includes(searchValue) ||
            trainer.expertise.toLowerCase().includes(searchValue);

        const matchesStatus =
            !selectedStatus || trainer.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Sorting
    filteredTrainers.sort(function (a, b) {
        switch (trainerSort.value) {
            case "name-desc":
                return b.name.localeCompare(a.name);

            case "id-asc":
                return a.id.localeCompare(b.id);

            case "expertise-asc":
                return a.expertise.localeCompare(b.expertise);

            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Pagination
    const totalPages = Math.max(
        1,
        Math.ceil(filteredTrainers.length / pageSize)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * pageSize;

    const visibleTrainers = filteredTrainers.slice(
        startIndex,
        startIndex + pageSize
    );

    if (visibleTrainers.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.className = "empty-cell";
        cell.textContent = trainers.length === 0
            ? "No trainers added yet. Click Add Trainer to get started."
            : "No trainers match your search or filter.";

        row.appendChild(cell);
        trainerTableBody.appendChild(row);
    }

    visibleTrainers.forEach(function (trainer) {
        const row = document.createElement("tr");

        row.appendChild(createCell(trainer.id, "trainer-id"));

        // Name and email
        const detailsCell = document.createElement("td");

        const name = document.createElement("span");
        name.className = "trainer-name";
        name.textContent = trainer.name;

        const email = document.createElement("span");
        email.className = "trainer-email";
        email.textContent = trainer.email;

        detailsCell.appendChild(name);
        detailsCell.appendChild(email);

        row.appendChild(detailsCell);

        row.appendChild(createCell(trainer.phone));
        row.appendChild(createCell(trainer.expertise, "expertise-text"));

        // Course chips
        const courseCell = document.createElement("td");
        courseCell.className = "course-list";

        const assignedCourses = getTrainerCourses(trainer);

        if (assignedCourses.length === 0) {
            courseCell.textContent = "No courses";
        } else {
            assignedCourses.forEach(function (course) {
                const chip = document.createElement("span");
                chip.className = "course-chip";
                chip.textContent = course.name;

                courseCell.appendChild(chip);
            });
        }

        row.appendChild(courseCell);

        // Status
        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className = "trainer-status status-" +
            trainer.status.toLowerCase();

        statusBadge.textContent = trainer.status;

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
            viewTrainer(trainer.id);
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            editTrainer(trainer.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            deleteTrainer(trainer.id);
        });

        actions.appendChild(viewButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        trainerTableBody.appendChild(row);
    });

    // Pagination details
    el("trainerRecordCount").textContent =
        filteredTrainers.length + " trainers";

    el("paginationInfo").textContent =
        filteredTrainers.length === 0
            ? "Showing 0 trainers"
            : `Showing ${startIndex + 1} to ${Math.min(
                startIndex + pageSize,
                filteredTrainers.length
            )} of ${filteredTrainers.length} trainers`;

    el("pageNumber").textContent =
        `${currentPage} / ${totalPages}`;

    previousPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

// Search, filter and sort
trainerSearch.addEventListener("input", function () {
    currentPage = 1;
    renderTrainers();
});

trainerStatusFilter.addEventListener("change", function () {
    currentPage = 1;
    renderTrainers();
});

trainerSort.addEventListener("change", function () {
    currentPage = 1;
    renderTrainers();
});

// Pagination
previousPage.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        renderTrainers();
    }
});

nextPage.addEventListener("click", function () {
    currentPage++;
    renderTrainers();
});

// Initial load
loadCourseOptions();
saveTrainers();
saveCourses();
updateStatistics();
renderTrainers();

// Refresh the list, counts and course options each time the section is shown
new MutationObserver(function () {
    if (!section.classList.contains("active-section")) return;

    refreshData();

    if (trainerFormSection.hidden) {
        loadCourseOptions();
    }

    updateStatistics();
    renderTrainers();
}).observe(section, { attributes: true, attributeFilter: ["class"] });

})();