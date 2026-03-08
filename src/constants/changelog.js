export const changelog = [
    {
        version: "1.27.0",
        date: "2026-03-08",
        changes: {
            new: [
                "Course Directory. A convenient place all the mateirals to ever exist enriched by the community!"
            ],
            improved: [
                "HomePage's Recent Activity now shows community posts and is clickable"
            ],
            fixed: [
                ""
            ]
        }
    },
    {
        version: "1.26.0",
        date: "2026-03-02",
        changes: {
            new: [
                "Live Seat Updates (Mercure integration) for real-time tracking in the pre-registration page",
                "Added 'Only Show Selected Courses' filter to easily find classes in your routine",
                "New global acknowledgements section for feature inspirations and original owners",
                "Displayed GitHub username as subheading on the contributors page"
            ],
            improved: [
                "Massive performance optimization on the pre-registration page for smoother scrolling and filtering",
                "Reordered 'Avoid Faculty' filter to the top of the filters modal for better accessibility",
                "Consistent background colors across main and dashboard pages",
                "Homepage feature cards now have consistently aligned 'Visit' buttons"
            ],
            fixed: [
                "Prevented duplicate routine imports by tracking source routine IDs",
                "Exported PNGs no longer include the 'remove course' buttons",
                "Cleaned up redundant API swap endpoints"
            ]
        }
    },
    {
        version: "1.25.0",
        date: "2026-02-27",
        changes: {
            new: [
                "Swap Request Notification System. Get notified when your swap request is approved or rejected.",
                "Optimized mobile view for better user experience.",
                "Dynamic Opengraph images for better social media sharing experience of routines.",
                "Ramadan Timings now auto switches across the dashboard",
                "Editable Routine Names for saved routines",
                "Edit Saved Routines and Merged Routines.",
                "This changelog page now shows all updates and changes to the Boracle platform"
            ],
            improved: [
                "Lightmode UI Consistency",
                "Error toast now has a close button and doesn't persist indefinitely",
                "Hover Tooltip now shows faculty image as well as class schedules",
                "Importing a routine now retains the routine name",
                "Merged Routines now retains the routineID",
                "All loaders are now replaced with skeleton loaders"
            ],
            fixed: [
                "Fix a bug where hover tooltip stayed open when user clicked on it while the course was removed",
                "A routine export to PNG bug due to incompatible html-to-image version on Firefox >147.0.3",
                "Merged Routines on Mobile now correctly identifies time matches"
            ]
        }
    }
];
