/*
! MARK: Data Structure Tree
! Adding This Here So Someone Else Understands What The Actual Fuck This Data Structure Is Supposed To Look Like
? And Of Course- For Future References
? But Mainly Because I believe I made it too complicated lmao (AI is also to partially blame for this)
cseCurriculum (Array)
│
├── Section
│   ├── section: "University & School Core"
│   ├── credits: 51
│   ├── description
│   └── streams (Array)
│       │
│       ├── Stream
│       │   ├── name: "Writing & Communication"
│       │   ├── credits: 6
│       │   └── courses (Array)
│       │       ├── Course
│       │       │   ├── code: "ENG091"
│       │       │   ├── name
│       │       │   ├── credits
│       │       │   └── optional
│       │       └── ...
│       │
│       ├── Stream
│       │   ├── name: "Mathematics & Natural Sciences"
│       │   └── courses [...]
│       │
│       └── ... (more streams)
│
├── Section
│   ├── section: "Program Core"
│   ├── credits: 75
│   ├── description
│   └── courses (Array)
│       ├── Course
│       │   ├── code: "CSE110"
│       │   ├── name
│       │   └── credits
│       └── ...
│
├── Section
│   ├── section: "Program Electives"
│   ├── credits: 6
│   ├── referenceLink
│   └── courses (Array)
│       ├── Elective Course
│       └── ...
│
├── Section
│   ├── section: "Final Requirement"
│   ├── credits: 4
│   └── courses (Array)
│       └── Project / Thesis / Internship
│
└── (end)
*/

/*
prerequisiteOverrides (Object)
│
├── courseCode: null (default = use CDN)
├── courseCode: null
├── CSE260: "CSE251"   // overridden prerequisite
└── ...
*/
// ! MARK: JSON Starts Here
export const csCurriculum = [
    {
        section: "University & School Core",
        credits: 51,
        description: "University Core (39) + School Core (12)",
        streams: [
            {
                name: "Stream 1: Writing & Communication",
                credits: 6,
                courses: [
                    { code: "ENG091", name: "Foundation Course", credits: 0 },
                    { code: "ENG101", name: "English Fundamentals", credits: 3 },
                    { code: "ENG102", name: "English Composition I", credits: 3 },
                    { code: "ENG103", name: "Advanced Writing Skills and Presentation (*only for ENG102 freshers)", credits: 3 },
                ],
            },
            {
                name: "Stream 2: Mathematics & Natural Sciences + School Core",
                credits: 21,
                courses: [
                    { code: "MAT092", name: "Remedial Mathematics", credits: 0, optional: false },
                    { code: "MAT110", name: "Math I: Differential Calculus & Coordinate Geometry", credits: 3, optional: false },
                    {
                        code: "MAT120",
                        name: "Math II: Integral Calculus and Differential Equations",
                        credits: 3,
                        optional: false,
                    },
                    {
                        code: "MAT215",
                        name: "Math III: Complex Variables and Laplace Transformations",
                        credits: 3,
                        optional: false,
                    },
                    { code: "MAT216", name: "Math IV: Linear Algebra and Fourier Analysis", credits: 3, optional: false },
                    { code: "PHY111", name: "Principles of Physics I", credits: 3, optional: false },
                    { code: "PHY112", name: "Principles of Physics II", credits: 3, optional: false },
                    { code: "STA201", name: "Statistics and Probability", credits: 3, optional: false },
                ],
            },
            {
                name: "Stream 3: Arts & Humanities",
                credits: 9,
                courses: [
                    { code: "HUM103", name: "Ethics and Culture", credits: 3 },
                    { code: "BNG103", name: "Bangla Language and Literature", credits: 3 },
                    {
                        code: "Stream 3 - COD",
                        name: "Choose one from list",
                        credits: 3,
                        alternatives: [
                            "HUM101",
                            "HUM102",
                            "HST102",
                            "HST103",
                            "HST104",
                            "HUM207",
                            "ENG110",
                            "ENG113",
                            "ENG114",
                            "ENG115",
                            "ENG333",
                        ],
                    },
                ],
                note: "One Course From: HUM101, HUM102, HST102, HST103, HST104, HUM207, ENG110, ENG113, ENG114, ENG115, ENG333",
            },
            {
                name: "Stream 4: Social Sciences",
                credits: 6,
                courses: [
                    {
                        code: "EMB101/DEV101",
                        name: "Emergence of Bangladesh / Bangladesh Studies",
                        credits: 3,
                    },
                    {
                        code: "Stream 4 - COD",
                        name: "Choose one from list",
                        credits: 3,
                        alternatives: [
                            "PSY101",
                            "SOC101",
                            "ANT101",
                            "POL101",
                            "BUS201",
                            "ECO101",
                            "ECO102",
                            "ECO105",
                            "BUS102",
                            "POL102",
                            "POL103",
                            "POL201",
                            "POL202",
                            "PSY102",
                            "DEV104",
                            "DEV201",
                            "SOC201/ANT202",
                            "ANT342",
                            "ANT351",
                            "BUS333",
                            "BUS334",
                            "BUS335",
                        ],
                    },
                ],
                note: "One Course From: PSY101, SOC101, ANT101, POL101, BUS201, ECO101, ECO102, ECO105, BUS102, POL102, POL103, POL201, POL202, PSY102, DEV104, DEV201, SOC201/ANT202, ANT342, ANT351, BUS333, BUS334, BUS335",
            },
            {
                name: "Stream 5: Community Service & Transformation",
                credits: 3,
                courses: [
                    {
                        code: "Stream 5 - COD",
                        name: "Choose one CST course",
                        credits: 3,
                        alternatives: [
                            "CST201",
                            "CST301",
                            "CST302",
                            "CST303",
                            "CST304",
                            "CST305",
                            "CST306",
                            "CST307",
                            "CST308",
                            "CST309",
                            "CST310",
                        ],
                    },
                ],
                note: "One Course From: CST201, CST301, CST302, CST303, CST304, CST305, CST306, CST307, CST308, CST309, CST310",
            },
            {
                name: "Courses Out Of Department (COD)",
                credits: 6,
                courses: [
                    { code: "COD - 4", name: "GenEd Elective", credits: 3, optional: true },
                    { code: "COD - 5", name: "GenEd Elective", credits: 3, optional: true },
                ],
                note: "Two Courses From: HUM101, HUM102, HST102, HST103, HST104, HUM207, ENG110, ENG113, ENG114, ENG115, ENG333, PSY101, SOC101, ANT101, POL101, BUS201, ECO101, ECO102, ECO105, BUS102, POL102, POL103, POL201, POL202, PSY102, DEV104, DEV201, SOC201/ANT202, ANT342, ANT351, BUS333, BUS334, BUS335, CST201, CST301, CST302, CST303, CST304, CST305, CST306, CST307, CST308, CST309, CST310, CHE101, BIO101, ENV103",
            },
        ],
    },

    {
        section: "Program Core",
        credits: 48,
        description: "Core Computer Science and Engineering courses",
        courses: [
            { code: "CSE110", name: "Programming Language I", credits: 3 },
            { code: "CSE111", name: "Programming Language II", credits: 3 },
            { code: "CSE220", name: "Data Structures", credits: 3 },
            { code: "CSE221", name: "Algorithms", credits: 3 },
            { code: "CSE230", name: "Discrete Mathematics", credits: 3 },
            { code: "CSE260", name: "Digital Logic Design", credits: 3 },
            { code: "CSE321", name: "Operating System", credits: 3 },
            { code: "CSE330", name: "Numerical Methods", credits: 3 },
            { code: "CSE331", name: "Automata and Computability", credits: 3 },
            { code: "CSE340", name: "Computer Architecture", credits: 3 },
            { code: "CSE370", name: "Database Systems", credits: 3 },
            { code: "CSE420", name: "Compiler Design", credits: 3 },
            { code: "CSE421", name: "Computer Networks", credits: 3 },
            { code: "CSE422", name: "Artificial Intelligence", credits: 3 },
            { code: "CSE423", name: "Computer Graphics", credits: 3 },
            { code: "CSE470", name: "Software Engineering", credits: 3 },
        ],
    },

    {
        section: "Program Electives",
        credits: 21,
        description:
            "Elective courses (minimum one must be a CSE elective) || Research the Elective Pre-Requisites Carefully From the Reference Link",
        referenceLink:
            "https://docs.google.com/spreadsheets/d/1-JM6a-JM4y4TiqMv9M4OXMBTnIAbn0lhsvfVGlfR1OU/edit?gid=1207964579#gid=1207964579",
        courses: [
            { code: "CS Elective - 1", name: "CSE Elective", credits: 3, elective: true },
            { code: "Open Elective - 2", name: "CSE / Minor / GenEd Elective", credits: 3, elective: true },
            { code: "Open Elective - 3", name: "CSE / Minor / GenEd Elective", credits: 3, elective: true },
            { code: "Open Elective - 4", name: "CSE / Minor / GenEd Elective", credits: 3, elective: true },
            { code: "Open Elective - 5", name: "CSE / Minor / GenEd Elective", credits: 3, elective: true },
            { code: "Open Elective - 6", name: "CSE / Minor / GenEd Elective", credits: 3, elective: true },
            { code: "Open Elective - 7", name: "CSE / Minor / GenEd Elective", credits: 3, elective: true },
        ],
    },

    {
        section: "Final Requirement",
        credits: 4,
        description: "Thesis / Project / Internship",
        referenceLink:
            "https://docs.google.com/document/d/1pAMjuQAxSEcLgkbvmx9qJGvK2BlPQhvXhgev8OeJTas/edit?tab=t.0#heading=h.aczyuw2yex2w",
        courses: [{ code: "CSE400", name: "Project / Thesis / Internship", credits: 4 }],
    },
];

// ! Calculate total credits from curriculum
export function getTotalCredits(curriculum = csCurriculum) {
    return curriculum.reduce((sum, section) => sum + (section.credits || 0), 0);
}

// ! Pre-req override map
const allCurriculumCourseCodes = Array.from(
    new Set(
        csCurriculum.flatMap((section) => {
            if (section.courses) return section.courses.map((c) => c.code);
            if (section.streams) return section.streams.flatMap((s) => s.courses.map((c) => c.code));
            return [];
        }),
    ),
);

export const prerequisiteOverrides = {
    ...Object.fromEntries(allCurriculumCourseCodes.map((code) => [code, null])),
    CSE260: "CSE230", // more realistic prereq
};

export const cseCurriculum = csCurriculum;
