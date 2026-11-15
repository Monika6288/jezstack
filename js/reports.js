
(function(){

// Safe localStorage reader
function getStoredData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error("Unable to read " + key, error);
        return fallback;
    }
}

// Load saved application data
const students = getStoredData("students", []);
const trainers = getStoredData("trainers", []);
const courses = getStoredData("courses", []);
const attendance = getStoredData("attendance", {});
const assignments = getStoredData("assignments", []);

// Admin profile
const adminProfile = getStoredData("adminProfile", null);
const adminName = adminProfile && adminProfile.name
    ? adminProfile.name
    : "Admin";

const sidebarName = document.getElementById("sidebarAdminName"); if (sidebarName) sidebarName.textContent = adminName;
const topName = document.getElementById("topAdminName"); if (topName) topName.textContent = adminName;

// DOM elements
const courseReportBody = document.getElementById("courseReportBody");
const attendanceReportBody = document.getElementById("attendanceReportBody");
const assignmentReportBody = document.getElementById("assignmentReportBody");

const attendanceSearch = document.getElementById("attendanceSearch");
const attendanceCourseFilter =
    document.getElementById("attendanceCourseFilter");

const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");

// Helpers
function getStudentCourse(student) {
    return student.course || student.courseName || "";
}

function getStudentEmail(student) {
    return (student.email || "").trim().toLowerCase();
}

function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createCell(value, className) {
    const cell = document.createElement("td");
    cell.textContent = value === undefined || value === null
        ? "—"
        : value;

    if (className) {
        cell.className = className;
    }

    return cell;
}

function showEmptyRow(tbody, columns, message) {
    tbody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = columns;
    cell.className = "empty-cell";
    cell.textContent = message;

    row.appendChild(cell);
    tbody.appendChild(row);
}

// Summary cards
function updateSummary() {
    document.getElementById("totalStudents").textContent =
        students.length;

    document.getElementById("totalCourses").textContent =
        courses.length;

    document.getElementById("totalTrainers").textContent =
        trainers.length;

    document.getElementById("totalDays").textContent =
        Object.keys(attendance).length;
}

// Course dropdown
function loadCourseFilter() {
    attendanceCourseFilter.innerHTML =
        '<option value="">All Courses</option>';

    courses.forEach(function (course) {
        const option = document.createElement("option");

        option.value = course.name;
        option.textContent = course.name;

        attendanceCourseFilter.appendChild(option);
    });
}

// Course enrollment report
function renderCourseReport() {
    courseReportBody.innerHTML = "";

    if (courses.length === 0) {
        showEmptyRow(
            courseReportBody,
            4,
            "No courses added yet. Add courses to view enrollment reports."
        );
        return;
    }

    courses.forEach(function (course) {
        const count = students.filter(function (student) {
            return getStudentCourse(student).toLowerCase() ===
                course.name.toLowerCase();
        }).length;

        const share = students.length === 0
            ? 0
            : Math.round((count / students.length) * 100);

        const row = document.createElement("tr");

        row.appendChild(createCell(course.name, "course-name"));
        row.appendChild(createCell(course.trainer || "Not assigned"));
        row.appendChild(createCell(count));

        const shareCell = document.createElement("td");

        const percentage = document.createElement("strong");
        percentage.className = "percentage-value";
        percentage.textContent = share + "%";

        const track = document.createElement("div");
        track.className = "percentage-track";

        const fill = document.createElement("div");
        fill.className = "percentage-fill";
        fill.style.width = share + "%";

        track.appendChild(fill);

        shareCell.appendChild(percentage);
        shareCell.appendChild(track);

        row.appendChild(shareCell);
        courseReportBody.appendChild(row);
    });
}

// Get attendance for one student within selected dates
function getStudentAttendance(student) {
    let present = 0;
    let absent = 0;
    let leave = 0;

    const email = getStudentEmail(student);

    Object.keys(attendance).forEach(function (date) {
        // Date range filter
        if (fromDate.value && date < fromDate.value) return;
        if (toDate.value && date > toDate.value) return;

        const dailyRecord = attendance[date];

        if (!dailyRecord || typeof dailyRecord !== "object") return;

        // Email matching is case-insensitive
        let status;

        const matchingEmail = Object.keys(dailyRecord).find(function (key) {
            return key.trim().toLowerCase() === email;
        });

        if (!matchingEmail) return;

        const savedValue = dailyRecord[matchingEmail];

        // Support both simple status strings and object-based records
        status = typeof savedValue === "string"
            ? savedValue
            : savedValue && savedValue.status;

        if (status === "Present") {
            present++;
        } else if (status === "Absent") {
            absent++;
        } else if (status === "Leave") {
            leave++;
        }
    });

    const countedDays = present + absent;

    const percentage = countedDays === 0
        ? null
        : Math.round((present / countedDays) * 100);

    return {
        present: present,
        absent: absent,
        leave: leave,
        countedDays: countedDays,
        percentage: percentage
    };
}

// Attendance percentage cell
function createPercentageCell(percentage) {
    const cell = document.createElement("td");

    if (percentage === null) {
        cell.textContent = "No records";
        return cell;
    }

    const value = document.createElement("strong");
    value.className = "percentage-value";
    value.textContent = percentage + "%";

    const track = document.createElement("div");
    track.className = "percentage-track";

    const fill = document.createElement("div");
    fill.className = "percentage-fill";
    fill.style.width = percentage + "%";

    track.appendChild(fill);

    cell.appendChild(value);
    cell.appendChild(track);

    return cell;
}

// Student attendance report
function renderAttendanceReport() {
    attendanceReportBody.innerHTML = "";

    const searchValue = attendanceSearch.value.trim().toLowerCase();
    const selectedCourse = attendanceCourseFilter.value;

    const filteredStudents = students.filter(function (student) {
        const matchesSearch =
            (student.name || "").toLowerCase().includes(searchValue) ||
            getStudentEmail(student).includes(searchValue);

        const matchesCourse =
            !selectedCourse ||
            getStudentCourse(student) === selectedCourse;

        return matchesSearch && matchesCourse;
    });

    if (filteredStudents.length === 0) {
        showEmptyRow(
            attendanceReportBody,
            7,
            students.length === 0
                ? "No students added yet."
                : "No students match your search or course filter."
        );

        document.getElementById("attendanceRecordCount").textContent =
            "0 students";

        return;
    }

    filteredStudents.forEach(function (student) {
        const report = getStudentAttendance(student);

        const row = document.createElement("tr");

        row.appendChild(createCell(student.name || "Unnamed student"));
        row.appendChild(createCell(getStudentEmail(student)));
        row.appendChild(createCell(getStudentCourse(student) || "—"));

        row.appendChild(
            createCell(report.present, "status-number present-number")
        );

        row.appendChild(
            createCell(report.absent, "status-number absent-number")
        );

        row.appendChild(
            createCell(report.leave, "status-number leave-number")
        );

        row.appendChild(createPercentageCell(report.percentage));

        attendanceReportBody.appendChild(row);
    });

    document.getElementById("attendanceRecordCount").textContent =
        filteredStudents.length + " students";
}

// Assignment report
function getAssignmentStudentCounts(assignment) {
    const courseStudents = students.filter(function (student) {
        return getStudentCourse(student) === assignment.course;
    });

    let submitted = 0;
    let notSubmitted = 0;
    let late = 0;
    let marksTotal = 0;
    let markedStudents = 0;

    courseStudents.forEach(function (student) {
        const email = getStudentEmail(student);
        const submission = assignment.submissions &&
            assignment.submissions[email];

        if (!submission) {
            notSubmitted++;
            return;
        }

        if (submission.status === "Submitted") {
            submitted++;
        } else if (submission.status === "Late") {
            late++;
        } else {
            notSubmitted++;
        }

        if (
            submission.marks !== "" &&
            submission.marks !== null &&
            submission.marks !== undefined &&
            Number.isFinite(Number(submission.marks))
        ) {
            marksTotal += Number(submission.marks);
            markedStudents++;
        }
    });

    return {
        total: courseStudents.length,
        submitted: submitted,
        notSubmitted: notSubmitted,
        late: late,
        averageMarks: markedStudents > 0
            ? Math.round((marksTotal / markedStudents) * 10) / 10
            : null
    };
}

function renderAssignmentReport() {
    assignmentReportBody.innerHTML = "";

    if (assignments.length === 0) {
        showEmptyRow(
            assignmentReportBody,
            7,
            "No assignments available. Create assignments to view performance."
        );
        return;
    }

    assignments.forEach(function (assignment) {
        const counts = getAssignmentStudentCounts(assignment);

        const row = document.createElement("tr");

        row.appendChild(createCell(assignment.title));
        row.appendChild(createCell(assignment.course));
        row.appendChild(createCell(counts.total));
        row.appendChild(createCell(counts.submitted));
        row.appendChild(createCell(counts.notSubmitted));
        row.appendChild(createCell(counts.late));

        row.appendChild(
            createCell(
                counts.averageMarks === null
                    ? "Not graded"
                    : counts.averageMarks + " / 100"
            )
        );

        assignmentReportBody.appendChild(row);
    });
}

// CSV export helper
function exportCSV(filename, headers, rows) {
    const csvEscape = function (value) {
        const text = String(value ?? "");
        return '"' + text.replace(/"/g, '""') + '"';
    };

    const csvContent = [
        headers.map(csvEscape).join(","),
        ...rows.map(function (row) {
            return row.map(csvEscape).join(",");
        })
    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// Export course report
function exportCourseReport() {
    const rows = courses.map(function (course) {
        const count = students.filter(function (student) {
            return getStudentCourse(student).toLowerCase() ===
                course.name.toLowerCase();
        }).length;

        const share = students.length === 0
            ? 0
            : Math.round((count / students.length) * 100);

        return [
            course.name,
            course.trainer || "Not assigned",
            count,
            share + "%"
        ];
    });

    exportCSV(
        "course-enrollment-report.csv",
        ["Course", "Trainer", "Students", "Enrollment Share"],
        rows
    );
}

// Export attendance report
function exportAttendanceReport() {
    const searchValue = attendanceSearch.value.trim().toLowerCase();
    const selectedCourse = attendanceCourseFilter.value;

    const filteredStudents = students.filter(function (student) {
        return (
            (
                (student.name || "").toLowerCase().includes(searchValue) ||
                getStudentEmail(student).includes(searchValue)
            ) &&
            (!selectedCourse || getStudentCourse(student) === selectedCourse)
        );
    });

    const rows = filteredStudents.map(function (student) {
        const report = getStudentAttendance(student);

        return [
            student.name || "",
            getStudentEmail(student),
            getStudentCourse(student),
            report.present,
            report.absent,
            report.leave,
            report.percentage === null ? "No records" : report.percentage + "%"
        ];
    });

    exportCSV(
        "student-attendance-report.csv",
        [
            "Student Name",
            "Email",
            "Course",
            "Present",
            "Absent",
            "Leave",
            "Attendance Percentage"
        ],
        rows
    );
}

// Export assignment report
function exportAssignmentReport() {
    const rows = assignments.map(function (assignment) {
        const counts = getAssignmentStudentCounts(assignment);

        return [
            assignment.title,
            assignment.course,
            counts.total,
            counts.submitted,
            counts.notSubmitted,
            counts.late,
            counts.averageMarks === null
                ? "Not graded"
                : counts.averageMarks + "/100"
        ];
    });

    exportCSV(
        "assignment-performance-report.csv",
        [
            "Assignment",
            "Course",
            "Total Students",
            "Submitted",
            "Not Submitted",
            "Late",
            "Average Marks"
        ],
        rows
    );
}

// Filter event listeners
attendanceSearch.addEventListener("input", renderAttendanceReport);

attendanceCourseFilter.addEventListener(
    "change",
    renderAttendanceReport
);

fromDate.addEventListener("change", function () {
    if (toDate.value && fromDate.value > toDate.value) {
        toDate.value = "";
    }

    renderAttendanceReport();
});

toDate.addEventListener("change", function () {
    if (fromDate.value && toDate.value < fromDate.value) {
        toDate.value = "";
    }

    renderAttendanceReport();
});

// Clear filters
document.getElementById("clearAttendanceFilters")
    .addEventListener("click", function () {
        attendanceSearch.value = "";
        attendanceCourseFilter.value = "";
        fromDate.value = "";
        toDate.value = "";

        renderAttendanceReport();
    });

// Export button listeners
document.getElementById("exportCourseReport")
    .addEventListener("click", exportCourseReport);

document.getElementById("exportAttendanceReport")
    .addEventListener("click", exportAttendanceReport);

document.getElementById("exportAssignmentReport")
    .addEventListener("click", exportAssignmentReport);

// Initial page setup
updateSummary();
loadCourseFilter();
renderCourseReport();
renderAttendanceReport();
renderAssignmentReport();

})();
