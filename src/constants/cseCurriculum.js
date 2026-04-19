
// ! Calculate total credits from curriculum
export function getTotalCredits() {
    let total = 0;
    for (const section of cseCurriculum) {
        if (Array.isArray(section.courses)) {
            total += section.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
        }
        if (Array.isArray(section.streams)) {
            for (const stream of section.streams) {
                total += stream.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
            }
        }
    }
    return total;
}

export const cseCurriculum = [
    {
        section: "University & School Core",
        credits: 51,
        description: "Combined University Core and School Core courses",
        streams: [
            {
                name: "Stream 1: Writing & Communication",
                credits: 6,
                courses: [
                    { code: "ENG091", name: "Foundation Course (in English)", credits: 0, optional: false },
                    { code: "ENG101", name: "Fundamentals of English", credits: 3, optional: false },
                    { code: "ENG102", name: "English Composition I", credits: 3, optional: false },
                    { code: "ENG103", name: "Advanced Writing Skills and Presentation", credits: 3, optional: false },
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
                    { code: "HUM103", name: "Ethics and Culture", credits: 3, optional: false },
                    { code: "BNG103", name: "Bangla Language and Literature", credits: 3, optional: false },
                    {
                        code: "Required Course - S3",
                        name: "Arts & Humanities Elective (Minimum one option)",
                        credits: 3,
                        optional: false,
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
                note: "Minimum one from: HUM101, HUM102, HST102, HST103, HST104, HUM207, ENG110, ENG113, ENG114, ENG115, ENG333",
            },
            {
                name: "Stream 4: Social Sciences",
                credits: 6,
                courses: [
                    { code: "EMB101", name: "Bangladesh Studies", credits: 3, optional: false, alternatives: ["DEV101"] },
                    {
                        code: "Required Course - S4",
                        name: "Social Sciences Elective (Minimum one option)",
                        credits: 3,
                        optional: false,
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
                note: "Minimum one from: PSY101, SOC101, ANT101, POL101, BUS201, ECO101, ECO102, ECO105, BUS102, POL102, POL103, POL201, POL202, PSY102, DEV104, DEV201, SOC201/ANT202, ANT342, ANT351, BUS333, BUS334, BUS335",
            },
            {
                name: "Stream 5: Community Service & Transformation",
                credits: 3,
                courses: [
                    {
                        code: "Required Course - S5",
                        name: "Community Service Course (Minimum one option)",
                        credits: 3,
                        optional: true,
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
                note: "Minimum one from: CST201, CST301, CST302, CST303, CST304, CST305, CST306, CST307, CST308, CST309, CST310",
            },
            {
                name: "Stream 6: Courses Out Of Department (COD)",
                credits: 6,
                courses: [
                    { code: "COD - 1", name: "Courses Out Of Department Option 1", credits: 3, optional: true },
                    { code: "COD - 2", name: "Courses Out Of Department Option 2", credits: 3, optional: true },
                ],
                note: "Choose any two 3-credit courses (6 credits total). Minimum one from: HUM101, HUM102, HST102, HST103, HST104, HUM207, ENG110, ENG113, ENG114, ENG115, ENG333, PSY101, SOC101, ANT101, POL101, BUS201, ECO101, ECO102, ECO105, BUS102, POL102, POL103, POL201, POL202, PSY102, DEV104, DEV201, SOC201/ANT202, ANT342, ANT351, BUS333, BUS334, BUS335, CST201, CST301, CST302, CST303, CST304, CST305, CST306, CST307, CST308, CST309, CST310, CHE101, BIO101, ENV103",
            },
        ],
    },
    {
        section: "Program Core",
        credits: 75,
        description: "Core Computer Science and Engineering courses",
        courses: [
            { code: "CSE110", name: "Programming Language I", credits: 3 },
            { code: "CSE111", name: "Programming Language II", credits: 3 },
            { code: "CSE220", name: "Data Structures", credits: 3 },
            { code: "CSE221", name: "Algorithms", credits: 3 },
            { code: "CSE230", name: "Discrete Mathematics", credits: 3 },
            { code: "CSE331", name: "Automata and Computability", credits: 3 },
            { code: "CSE250", name: "Circuits and Electronics", credits: 3 },
            { code: "CSE251", name: "Electronic Devices and Circuits", credits: 3 },
            { code: "CSE260", name: "Digital Logic Design", credits: 3 },
            { code: "CSE350", name: "Digital Electronics and Pulse Techniques", credits: 3 },
            { code: "CSE341", name: "Microprocessors", credits: 3 },
            { code: "CSE360", name: "Computer Interfacing", credits: 3 },
            { code: "CSE321", name: "Operating System", credits: 3 },
            { code: "CSE340", name: "Computer Architecture", credits: 3 },
            { code: "CSE320", name: "Data Communications", credits: 3 },
            { code: "CSE421", name: "Computer Networks", credits: 3 },
            { code: "CSE370", name: "Database Systems", credits: 3 },
            { code: "CSE330", name: "Numerical Methods", credits: 3 },
            { code: "CSE420", name: "Compiler Design", credits: 3 },
            { code: "CSE422", name: "Artificial Intelligence", credits: 3 },
            { code: "CSE423", name: "Computer Graphics", credits: 3 },
            { code: "CSE460", name: "VLSI Design", credits: 3 },
            { code: "CSE461", name: "Introduction to Robotics", credits: 3 },
            { code: "CSE470", name: "Software Engineering", credits: 3 },
            { code: "CSE471", name: "Systems Analysis and Design", credits: 3 },
        ],
    },
    {
        section: "Program Electives",
        credits: 6,
        description: "Choose elective courses to specialize",
        referenceLink: "https://docs.google.com/spreadsheets/d/1-JM6a-JM4y4TiqMv9M4OXMBTnIAbn0lhsvfVGlfR1OU/edit?gid=1207964579#gid=1207964579",
        courses: [
            { code: "CSEElective", name: "CSE Elective (Any 300/400 level CSE course)", credits: 3, elective: true },
            { code: "OpenElective", name: "Open Elective (CSE / Minor / GenEd)", credits: 3, elective: true },
        ],
    },
    {
        section: "Final Requirement",
        credits: 4,
        description: "Capstone project or thesis",
        courses: [{ code: "CSE400", name: "Project / Thesis", credits: 4 }],
    },
];

// ! Pre-req override map
// null means "use prerequisite from Connect CDN".
// Any non-null string overrides the CDN prerequisite for that course code.
const allCurriculumCourseCodes = Array.from(
    new Set(
        cseCurriculum.flatMap((section) => {
            if (Array.isArray(section.courses)) {
                return section.courses.map((course) => course.code);
            }
            if (Array.isArray(section.streams)) {
                return section.streams.flatMap((stream) => stream.courses.map((course) => course.code));
            }
            return [];
        }),
    ),
);

export const prerequisiteOverrides = {
    ...Object.fromEntries(allCurriculumCourseCodes.map((code) => [code, null])),
    CSE260: "CSE251",
};

