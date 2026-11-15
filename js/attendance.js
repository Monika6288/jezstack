
(function(){

// DOM elements
const attendanceDate = document.getElementById("attendanceDate");
const attendanceCourse = document.getElementById("attendanceCourse");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const attendanceMessage = document.getElementById("attendanceMessage");
const attendanceSummary = document.getElementById("attendanceSummary");
const studentSearch = document.getElementById("studentSearch");

const historyCourse = document.getElementById("historyCourse");
const historyDate = document.getElementById("historyDate");
const historyStudent = document.getElementById("historyStudent");
const historyStatus = document.getElementById("historyStatus");
const historyTableBody = document.getElementById("historyTableBody");

const historyPrevious = document.getElementById("historyPrevious");
const historyNext = document.getElementById("historyNext");

const historyPageSize = 8;
let historyCurrentPage = 1;

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

// Load data
const students = getStoredData("students", []);
const courses = getStoredData("courses", []);
let attendance = getStoredData("attendance", {});

// Admin profile
const adminProfile = getStoredData("adminProfile", null);
const adminName = adminProfile && adminProfile.name
    ? adminProfile.name
    : "Admin";

const sidebarName = document.getElementById("sidebarAdminName"); if (sidebarName) sidebarName.textContent = adminName;
const topName = document.getElementById("topAdminName"); if (topName) topName.textContent = adminName;

// Get local date as YYYY-MM-DD
function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Display messages
function showMessage(message, type) {
    attendanceMessage.textContent = message;
    attendanceMessage.className = "message-box " + (type || "");
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return "—";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Get student course name
function getStudentCourse(student) {
    return student.course || student.courseName || "";
}

// Get student email
function getStudentEmail(student) {
    return (student.email || "").trim().toLowerCase();
}

// Get student ID
function getStudentId(student, index) {
    return student.id || student.studentId ||
        `STU${String(index + 1).padStart(3, "0")}`;
}

// Find a course using its stored value
function findCourse(courseValue) {
    return courses.find(function (course) {
        return course.name === courseValue ||
            course.id === courseValue ||
            course.courseId === courseValue;
    });
}

// Get students for a selected course
function getCourseStudents(courseValue) {
    if (!courseValue) return [];

    const selectedCourse = findCourse(courseValue);

    return students.filter(function (student) {
        const studentCourse = getStudentCourse(student);

        return studentCourse === courseValue ||
            (selectedCourse && studentCourse === selectedCourse.name) ||
            (selectedCourse && studentCourse === selectedCourse.id);
    });
}

// Get a student's saved attendance statuses
function getStudentAttendance(student) {
    const email = getStudentEmail(student);

    if (!email) return [];

    const records = [];

    Object.keys(attendance).forEach(function (date) {
        const dayRecord = attendance[date];

        if (
            dayRecord &&
            typeof dayRecord === "object" &&
            !Array.isArray(dayRecord) &&
            dayRecord[email]
        ) {
            records.push({
                date: date,
                status: dayRecord[email]
            });
        }
    });

    return records;
}

// Calculate student attendance percentage.
// Leave is excluded from the total class days.
function getAttendancePercentage(student) {
    const records = getStudentAttendance(student);

    const presentDays = records.filter(function (record) {
        return record.status === "Present";
    }).length;

    const absentDays = records.filter(function (record) {
        return record.status === "Absent";
    }).length;

    const totalCountedDays = presentDays + absentDays;

    if (totalCountedDays === 0) return 0;

    return Math.round((presentDays / totalCountedDays) * 100);
}

// Load course options
function loadCourseOptions() {
    attendanceCourse.innerHTML =
        '<option value="">Choose a course</option>';

    historyCourse.innerHTML =
        '<option value="">All Courses</option>';

    const courseOptions = [];

    courses.forEach(function (course) {
        if (course.name && !courseOptions.some(function (item) {
            return item.value === course.name;
        })) {
            courseOptions.push({
                value: course.name,
                label: course.name
            });
        }
    });

    // Support older student records when courses are not yet registered.
    students.forEach(function (student) {
        const courseName = getStudentCourse(student);

        if (courseName && !courseOptions.some(function (item) {
            return item.value === courseName;
        })) {
            courseOptions.push({
                value: courseName,
                label: courseName
            });
        }
    });

    courseOptions.forEach(function (course) {
        const option = document.createElement("option");
        option.value = course.value;
        option.textContent = course.label;

        attendanceCourse.appendChild(option);

        const historyOption = option.cloneNode(true);
        historyCourse.appendChild(historyOption);
    });
}

// Update summary cards
function updateSummaryCards(courseStudents, dayRecord) {
    let present = 0;
    let absent = 0;
    let leave = 0;

    courseStudents.forEach(function (student) {
        const status = dayRecord[getStudentEmail(student)];

        if (status === "Present") present++;
        if (status === "Absent") absent++;
        if (status === "Leave") leave++;
    });

    document.getElementById("totalStudents").textContent =
        courseStudents.length;

    document.getElementById("presentCount").textContent = present;
    document.getElementById("absentCount").textContent = absent;
    document.getElementById("leaveCount").textContent = leave;
}

// Update saved / unsaved indicator
function updateRecordStatus(isSaved) {
    const status = document.getElementById("attendanceRecordStatus");

    status.textContent = isSaved ? "Saved" : "Not saved";
    status.classList.toggle("saved", isSaved);
}

// Create a table cell
function createCell(text, className) {
    const cell = document.createElement("td");
    cell.textContent = text || "—";

    if (className) {
        cell.className = className;
    }

    return cell;
}

// Render attendance list
function renderAttendance() {
    attendanceTableBody.innerHTML = "";

    const courseValue = attendanceCourse.value;
    const dateValue = attendanceDate.value;

    saveAttendanceBtn.disabled = true;

    if (!courseValue || !dateValue) {
        showEmptyAttendance(
            "Select a course and date to display students."
        );
        resetSummaryCards();
        attendanceSummary.textContent =
            "Select a course and date to view the attendance summary.";
        updateRecordStatus(false);
        return;
    }

    const courseStudents = getCourseStudents(courseValue);
    const dayRecord = attendance[dateValue] || {};

    const searchValue = studentSearch.value.trim().toLowerCase();

    const filteredStudents = courseStudents.filter(function (student) {
        const name = (student.name || "").toLowerCase();
        const email = getStudentEmail(student);
        const id = (student.id || student.studentId || "").toLowerCase();

        return name.includes(searchValue) ||
            email.includes(searchValue) ||
            id.includes(searchValue);
    });

    document.getElementById("selectedCourseInfo").textContent =
        `${courseValue} · ${formatDate(dateValue)} · ${courseStudents.length} students`;

    if (courseStudents.length === 0) {
        showEmptyAttendance(
            "No students are enrolled in this course. Add students first."
        );

        resetSummaryCards();
        attendanceSummary.textContent = "No students available for this course.";
        updateRecordStatus(false);
        return;
    }

    filteredStudents.forEach(function (student) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");

        const name = document.createElement("span");
        name.className = "student-name";
        name.textContent = student.name || "Unnamed student";

        const email = document.createElement("span");
        email.className = "student-email";
        email.textContent = student.email || "No email";

        nameCell.appendChild(name);
        nameCell.appendChild(email);
        row.appendChild(nameCell);

        const studentIndex = students.indexOf(student);

        row.appendChild(
            createCell(getStudentId(student, studentIndex), "student-id")
        );

        row.appendChild(createCell(student.email));

        const statusCell = document.createElement("td");
        const select = document.createElement("select");

        select.className = "statusSelect";
        select.dataset.email = getStudentEmail(student);

        ["Present", "Absent", "Leave"].forEach(function (status) {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            select.appendChild(option);
        });

        // Existing records are loaded. New records default to Present.
        select.value = dayRecord[getStudentEmail(student)] || "Present";

        updateStatusSelectStyle(select);

        select.addEventListener("change", function () {
            updateStatusSelectStyle(select);
            updateSummaryPreview(courseStudents);
            updateRecordStatus(false);
        });

        statusCell.appendChild(select);
        row.appendChild(statusCell);

        attendanceTableBody.appendChild(row);
    });

    saveAttendanceBtn.disabled = filteredStudents.length === 0;

    updateSummaryCards(courseStudents, dayRecord);
    updateSummaryPreview(courseStudents);

    const allStudentsSaved = courseStudents.every(function (student) {
        return Boolean(dayRecord[getStudentEmail(student)]);
    });

    updateRecordStatus(allStudentsSaved);
}

// Empty state
function showEmptyAttendance(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.className = "empty-cell";
    cell.textContent = message;

    row.appendChild(cell);
    attendanceTableBody.appendChild(row);
}

// Reset summary cards
function resetSummaryCards() {
    document.getElementById("totalStudents").textContent = "0";
    document.getElementById("presentCount").textContent = "0";
    document.getElementById("absentCount").textContent = "0";
    document.getElementById("leaveCount").textContent = "0";
}

// Update status colour
function updateStatusSelectStyle(select) {
    select.classList.remove(
        "status-present",
        "status-absent",
        "status-leave"
    );

    select.classList.add(
        "status-" + select.value.toLowerCase()
    );
}

// Update live summary before saving
function updateSummaryPreview(courseStudents) {
    let present = 0;
    let absent = 0;
    let leave = 0;

    document.querySelectorAll(".statusSelect").forEach(function (select) {
        if (select.value === "Present") present++;
        if (select.value === "Absent") absent++;
        if (select.value === "Leave") leave++;
    });

    const total = courseStudents.length;

    attendanceSummary.textContent =
        `Current selection: ${present} Present, ${absent} Absent, ${leave} Leave out of ${total} students.`;

    document.getElementById("presentCount").textContent = present;
    document.getElementById("absentCount").textContent = absent;
    document.getElementById("leaveCount").textContent = leave;
}

// Save attendance
saveAttendanceBtn.addEventListener("click", function () {
    const courseValue = attendanceCourse.value;
    const dateValue = attendanceDate.value;

    if (!courseValue || !dateValue) {
        showMessage("Please select a course and date.", "error");
        return;
    }

    if (dateValue > getToday()) {
        showMessage("Attendance cannot be recorded for a future date.", "error");
        return;
    }

    const courseStudents = getCourseStudents(courseValue);

    if (courseStudents.length === 0) {
        showMessage("There are no students in this course.", "error");
        return;
    }

    // Preserve other courses' attendance on the same date.
    const existingRecord = attendance[dateValue] || {};

    const updatedRecord = { ...existingRecord };

    // Save each displayed student once, using email as the unique key.
    document.querySelectorAll(".statusSelect").forEach(function (select) {
        updatedRecord[select.dataset.email] = select.value;
    });

    attendance[dateValue] = updatedRecord;

    try {
        localStorage.setItem("attendance", JSON.stringify(attendance));

        showMessage(
            "Attendance saved successfully for " + courseValue + ".",
            "success"
        );

        renderAttendance();
        renderAttendanceHistory();

    } catch (error) {
        console.error("Unable to save attendance:", error);
        showMessage(
            "Unable to save attendance. Please check browser storage.",
            "error"
        );
    }
});

// Load attendance when course or date changes
attendanceCourse.addEventListener("change", function () {
    studentSearch.value = "";
    showMessage("", "");
    renderAttendance();
});

attendanceDate.addEventListener("change", function () {
    showMessage("", "");
    renderAttendance();
});

studentSearch.addEventListener("input", renderAttendance);

// Attendance history
function buildAttendanceHistory() {
    const records = [];

    Object.keys(attendance).sort().reverse().forEach(function (date) {
        const dayRecord = attendance[date];

        if (!dayRecord || typeof dayRecord !== "object") return;

        Object.keys(dayRecord).forEach(function (email) {
            const student = students.find(function (item) {
                return getStudentEmail(item) === email.toLowerCase();
            });

            if (!student) return;

            records.push({
                date: date,
                student: student,
                email: email,
                course: getStudentCourse(student),
                status: dayRecord[email],
                percentage: getAttendancePercentage(student)
            });
        });
    });

    return records;
}

// Render attendance history table
function renderAttendanceHistory() {
    historyTableBody.innerHTML = "";

    const selectedCourse = historyCourse.value;
    const selectedDate = historyDate.value;
    const searchValue = historyStudent.value.trim().toLowerCase();
    const selectedStatus = historyStatus.value;

    let records = buildAttendanceHistory();

    records = records.filter(function (record) {
        const matchesCourse =
            !selectedCourse || record.course === selectedCourse;

        const matchesDate =
            !selectedDate || record.date === selectedDate;

        const matchesStudent =
            !searchValue ||
            (record.student.name || "").toLowerCase().includes(searchValue) ||
            record.email.toLowerCase().includes(searchValue) ||
            (record.student.id || record.student.studentId || "")
                .toLowerCase().includes(searchValue);

        const matchesStatus =
            !selectedStatus || record.status === selectedStatus;

        return matchesCourse &&
            matchesDate &&
            matchesStudent &&
            matchesStatus;
    });

    const totalPages = Math.max(
        1,
        Math.ceil(records.length / historyPageSize)
    );

    if (historyCurrentPage > totalPages) {
        historyCurrentPage = totalPages;
    }

    const startIndex = (historyCurrentPage - 1) * historyPageSize;

    const visibleRecords = records.slice(
        startIndex,
        startIndex + historyPageSize
    );

    if (visibleRecords.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-cell";
        cell.textContent = "No attendance records match your filters.";

        row.appendChild(cell);
        historyTableBody.appendChild(row);
    }

    visibleRecords.forEach(function (record) {
        const row = document.createElement("tr");

        row.appendChild(createCell(formatDate(record.date)));

        const studentCell = document.createElement("td");

        const name = document.createElement("span");
        name.className = "student-name";
        name.textContent = record.student.name || "Unnamed student";

        const email = document.createElement("span");
        email.className = "student-email";
        email.textContent = record.email;

        studentCell.appendChild(name);
        studentCell.appendChild(email);

        row.appendChild(studentCell);
        row.appendChild(createCell(record.course));

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className =
            "status-badge status-" + record.status.toLowerCase();

        badge.textContent = record.status;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        row.appendChild(
            createCell(record.percentage + "%")
        );

        historyTableBody.appendChild(row);
    });

    document.getElementById("historyRecordCount").textContent =
        records.length + " records";

    document.getElementById("historyPaginationInfo").textContent =
        records.length === 0
            ? "Showing 0 records"
            : `Showing ${startIndex + 1} to ${Math.min(
                startIndex + historyPageSize,
                records.length
            )} of ${records.length} records`;

    document.getElementById("historyPageNumber").textContent =
        `${historyCurrentPage} / ${totalPages}`;

    historyPrevious.disabled = historyCurrentPage === 1;
    historyNext.disabled = historyCurrentPage === totalPages;
}

// History filters
[historyCourse, historyStatus].forEach(function (element) {
    element.addEventListener("change", function () {
        historyCurrentPage = 1;
        renderAttendanceHistory();
    });
});

historyDate.addEventListener("change", function () {
    historyCurrentPage = 1;
    renderAttendanceHistory();
});

historyStudent.addEventListener("input", function () {
    historyCurrentPage = 1;
    renderAttendanceHistory();
});

// History pagination
historyPrevious.addEventListener("click", function () {
    if (historyCurrentPage > 1) {
        historyCurrentPage--;
        renderAttendanceHistory();
    }
});

historyNext.addEventListener("click", function () {
    historyCurrentPage++;
    renderAttendanceHistory();
});

// Initial page load
loadCourseOptions();

attendanceDate.max = getToday();
attendanceDate.value = getToday();

renderAttendance();
renderAttendanceHistory();

})();
