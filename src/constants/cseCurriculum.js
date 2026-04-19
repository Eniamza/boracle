
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
        section: "Foundation & Core Skills",
        credits: 51, // 39 + 12 = 51 total credits
        description: "Combined University Core and School Core courses",
        streams: [
            {
                name: "Writing & Communication",
                credits: 9,
                courses: [
                    { code: "ENG091", name: "Foundation Course (in English)", credits: 0, optional: false },
                    { code: "ENG101", name: "Fundamentals of English", credits: 3, optional: false },
                    { code: "ENG102", name: "English Composition I", credits: 3, optional: false },
                    { code: "ENG103", name: "Advanced Writing Skills and Presentation", credits: 3, optional: false },
                ],
            },
            {
                name: "Mathematics & Natural Sciences",
                credits: 18,
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
                name: "Arts & Humanities",
                credits: 6,
                courses: [
                    { code: "HUM103", name: "Ethics and Culture", credits: 3, optional: false },
                    { code: "BNG103", name: "Bangla Language and Literature", credits: 3, optional: false },
                ],
            },
            {
                name: "Social Sciences",
                credits: 3,
                courses: [{ code: "EMB101", name: "Bangladesh Studies", credits: 3, optional: false, alternatives: ["DEV101"] }],
            },
            {
                name: "Community Service & Transformation",
                credits: 9,
                courses: [
                    { code: "CST201", name: "Community Service I", credits: 3, optional: true },
                    { code: "CST301", name: "Community Service II", credits: 3, optional: true },
                    { code: "CST310", name: "Community Leadership", credits: 3, optional: true },
                ],
                note: "Choose any 3 credits from optional courses",
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

