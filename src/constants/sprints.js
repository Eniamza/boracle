export const sprints = [
    {
        sprint: "Sprint 2",
        date: "2026-02-26 to currently ongoing",
        status: {
            pending: [
                { text: "Swap Request Notification System (Email alerts for approved/rejected swaps)", type: "Enhancement" },
                { text: "Course Directory UI and related Endpoints", type: "Enhancement" },
            ],
            finished: [
                { text: "Background Scroll Lock when routine modal was open on Desktop", type: "Bug" },
                { text: "Live Pre-Registration Seat Updates via Mercure Integration", type: "Enhancement" },
                { text: "Dynamic Opengraph metadata for public tooling pages", type: "Enhancement" },
                { text: "'Only Show Selected Courses' filter for routine management", type: "Enhancement" },
                { text: "Massive performance optimization on Pre-registration filtering and rendering", type: "Enhancement" },
                { text: "Optimized mobile view layouts for better accessibility", type: "Enhancement" },
                { text: "Reordered 'Avoid Faculty' filter for easier access", type: "Enhancement" },
                { text: "Importing a routine now retains the creator's name", type: "Enhancement" },
                { text: "Skeleton loaders introduced across all data fetching states", type: "Enhancement" },
                { text: "Duplicate routine imports prevented via source routineID tracking", type: "Bug" },
                { text: "Routine export to PNG bugs resolved (removed UI elements and fixed Firefox issues)", type: "Bug" },
                { text: "Hover tooltip closure bug when a respective course is removed", type: "Bug" },
                { text: "Merged Routines on Mobile correctly identifying time matches", type: "Bug" },
            ]
        }
    },
    {
        sprint: "Sprint 1",
        date: "2026-02-18 to 2026-02-25",
        status: {
            pending: [],
            finished: [
                { text: "First Private Beta release", type: "Enhancement" }
            ]
        }
    }
];
