
(function () {
    const links = Array.from(
        document.querySelectorAll('.navbar [data-section]')
    );

    const sections = Array.from(
        document.querySelectorAll('.page-section')
    );

    function showSection(id, updateAddress = true) {
        const target = document.getElementById(id);

        if (!target || !target.classList.contains('page-section')) {
            return;
        }

        // Hide all sections and show selected section
        sections.forEach(section => {
            section.classList.toggle(
                'active-section',
                section.id === id
            );
        });

        // Update active navigation item
        links.forEach(link => {
            link.classList.toggle(
                'active',
                link.dataset.section === id
            );
        });

        // Update URL hash
        if (
            updateAddress &&
            window.location.hash !== `#${id}`
        ) {
            history.replaceState(null, '', `#${id}`);
        }

        window.scrollTo({
            top: 0,
            behavior: 'auto'
        });
    }

    // Make function accessible to other scripts
    window.showSection = showSection;

    // Old page links mapped to single-page sections
    const oldPageMap = {
        'dashboard.html': 'dashboard',
        'students.html': 'students',
        'courses.html': 'courses',
        'trainers.html': 'trainers',
        'attendance.html': 'attendance',
        'assignments.html': 'assignments',
        'reports.html': 'reports',
        'profile.html': 'profile'
    };

    // Handle navigation and shortcut clicks
    document.addEventListener('click', function (event) {
        const link = event.target.closest('a');

        if (!link) return;

        let sectionId = link.dataset.section || '';

        const href = link.getAttribute('href') || '';

        if (!sectionId && href.startsWith('#')) {
            sectionId = href.slice(1);
        }

        if (!sectionId && oldPageMap[href]) {
            sectionId = oldPageMap[href];
        }

        const target = document.getElementById(sectionId);

        if (
            sectionId &&
            target &&
            target.classList.contains('page-section')
        ) {
            event.preventDefault();
            showSection(sectionId);
        }
    });

    // Open dashboard or previously selected section
    const initialSection = window.location.hash.slice(1);

    showSection(
        document.getElementById(initialSection)?.classList.contains(
            'page-section'
        )
            ? initialSection
            : 'dashboard',
        false
    );
})();
