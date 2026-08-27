/*
! MARK: Data Structure Tree
! Keeping This Aligned With The CS/CSE Curriculum Modules So The Page Can Treat Every Department The Same Way
*/

/*
prerequisiteOverrides (Object)
│
├── courseCode: null (default = use CDN)
├── courseCode: null
└── ...
*/

// ! MARK: JSON Starts Here
const generalEducationWritingOptions = ["ENG101", "ENG102", "ENG103"];
const generalEducationMathOptions = ["MAT101", "MAT110", "STA101", "STA201", "PHY101", "PHY111", "CHE101", "BIO101", "ENV103", "CSE101"];
const generalEducationHumanitiesOptions = [
    "ENG113",
    "ENG114",
    "ENG115",
    "ENG333",
    "HUM101",
    "HUM102",
    "HST102",
    "HST103",
    "ARC294",
    "ARC122",
];
const generalEducationSocialScienceOptions = [
    "BUS101",
    "BUS102",
    "BUS201",
    "ECO105",
    "POL101",
    "ANT101",
    "SOC101",
    "PSY101",
    "SOC201",
    "ANT210",
    "ANT342",
    "ANT351",
];
const generalEducationCommunityOptions = ["CST301", "CST302", "CST303", "CST304", "CST305"];
const generalEducationAdditionalOptions = Array.from(
    new Set([
        ...generalEducationWritingOptions,
        ...generalEducationMathOptions,
        ...generalEducationHumanitiesOptions,
        ...generalEducationSocialScienceOptions,
        ...generalEducationCommunityOptions,
    ]),
);

export const microbiologyCurriculum = [
    {
        section: "General Education",
        credits: 39,
        description: "University Core (39 credits). Complete the COD-style slots below to satisfy the minimum requirements, then fill the additional COD slots to reach 39 credits.",
        streams: [
            {
                name: "Stream 1: Writing Comprehension",
                credits: 6,
                note: "Take any 2 of the ENG courses (each 3 credits).",
                courses: [
                    {
                        code: "MIC-GENED-ENG-COD-1",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationWritingOptions,
                    },
                    {
                        code: "MIC-GENED-ENG-COD-2",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationWritingOptions,
                    },
                ],
            },
            {
                name: "Stream 2: Math and Natural Sciences",
                credits: 6,
                note: "Take minimum 2 courses from the list (each 3 credits).",
                courses: [
                    {
                        code: "MIC-GENED-MNS-COD-1",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationMathOptions,
                    },
                    {
                        code: "MIC-GENED-MNS-COD-2",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationMathOptions,
                    },
                ],
            },
            {
                name: "Stream 3: Arts and Humanities",
                credits: 9,
                note: "BNG103 and HUM103 are compulsory. After completing those, take minimum 1 additional course from the list (each 3 credits).",
                courses: [
                    { code: "BNG103", name: "Bangla Language and Literature", credits: 3, optional: false },
                    { code: "HUM103", name: "Ethics and Culture", credits: 3, optional: false },
                    {
                        code: "MIC-GENED-HUM-COD",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationHumanitiesOptions,
                    },
                ],
            },
            {
                name: "Stream 4: Social Sciences",
                credits: 6,
                note: "EMB101 is compulsory. After completing it, take minimum 1 additional course from the list (each 3 credits).",
                courses: [
                    { code: "EMB101", name: "Emergence of Bangladesh", credits: 3, optional: false },
                    {
                        code: "MIC-GENED-SOC-COD",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationSocialScienceOptions,
                    },
                ],
            },
            {
                name: "Stream 5: Communities, Seeking Transformation",
                credits: 3,
                note: "Take exactly 1 course from the list (3 credits).",
                courses: [
                    {
                        code: "MIC-GENED-CST-COD",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationCommunityOptions,
                    },
                ],
            },
            {
                name: "Courses Out Of Department (COD)",
                credits: 9,
                note: "Take 3 additional 3-credit courses from the general education pool above to reach 39 credits.",
                courses: [
                    {
                        code: "MIC-GENED-COD-1",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationAdditionalOptions,
                    },
                    {
                        code: "MIC-GENED-COD-2",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationAdditionalOptions,
                    },
                    {
                        code: "MIC-GENED-COD-3",
                        name: "Pick one course from the provided options above",
                        credits: 3,
                        optional: false,
                        alternatives: generalEducationAdditionalOptions,
                    },
                ],
            }
        ]
    },
    {
        section: "Program Core",
        credits: 75,
        description: "Departmental Core Courses: 63 credits of theory + 12 credits of laboratory.",
        courses: [
            // Theoretical courses (21 x 3 credits)
            { code: "MIC101", name: "Introduction to Microbiology", credits: 3 },
            { code: "BCH101", name: "Basic Biochemistry", credits: 3 },
            { code: "BCH102", name: "Biophysical Chemistry", credits: 3 },
            { code: "MIC102", name: "Basic Techniques in Microbiology", credits: 3 },
            { code: "BCH201", name: "Human Physiology", credits: 3 },
            { code: "MIC201", name: "Microbial Chemistry", credits: 3 },
            { code: "MIC202", name: "Microbial Metabolism", credits: 3 },
            { code: "MIC203", name: "Environmental Microbiology", credits: 3 },
            { code: "MIC204", name: "Medical Microbiology", credits: 3 },
            { code: "MIC206", name: "Introduction to Molecular Biology", credits: 3 }, // BTE207/MIC206
            { code: "MIC300", name: "Basic Immunology", credits: 3 }, // MIC300/BCH301
            { code: "MIC301", name: "Virology", credits: 3 },
            { code: "MIC302", name: "Food Microbiology", credits: 3 },
            { code: "MIC303", name: "Agriculture Microbiology", credits: 3 },
            { code: "MIC306", name: "Pharmaceutical Microbiology", credits: 3 },
            { code: "MIC308", name: "Fermentation Technology", credits: 3 },
            { code: "MIC310", name: "Advanced Molecular Biology", credits: 3 },
            { code: "BTE401", name: "Bioinformatics", credits: 3 },
            { code: "MIC401", name: "Microbial Genetic Engineering", credits: 3 },
            { code: "MIC402", name: "Analytical Microbiology", credits: 3 },
            { code: "MIC403", name: "Microbiological Quality Control of Foods, Fish and Beverages", credits: 3 },
            // Laboratory courses (4 x 3 credits)
            { code: "MIC155", name: "Microbial LAB I", credits: 3 },
            { code: "MIC255", name: "Microbial LAB II", credits: 3 },
            { code: "MIC355", name: "Microbial LAB III", credits: 3 },
            { code: "MIC455", name: "Microbial LAB IV", credits: 3 }
        ]
    },
    {
        section: "Program Electives",
        credits: 15,
        description: "Select 15 credits from the following elective courses.",
        referenceLink: "",
        courses: [
            {
                code: "MIC-ELECTIVE-1",
                name: "Pick one course from the provided options above",
                credits: 3,
                elective: true,
                alternatives: [
                    "BCH202",
                    "BTE312",
                    "BTE313",
                    "BTE315",
                    "BTE317",
                    "BTE403",
                    "BTE404",
                    "MIC304",
                    "MIC307",
                    "MIC309",
                    "MIC404",
                    "MIC405",
                    "MIC406",
                    "MIC407",
                    "MIC408",
                ],
            },
            {
                code: "MIC-ELECTIVE-2",
                name: "Pick one course from the provided options above",
                credits: 3,
                elective: true,
                alternatives: [
                    "BCH202",
                    "BTE312",
                    "BTE313",
                    "BTE315",
                    "BTE317",
                    "BTE403",
                    "BTE404",
                    "MIC304",
                    "MIC307",
                    "MIC309",
                    "MIC404",
                    "MIC405",
                    "MIC406",
                    "MIC407",
                    "MIC408",
                ],
            },
            {
                code: "MIC-ELECTIVE-3",
                name: "Pick one course from the provided options above",
                credits: 3,
                elective: true,
                alternatives: [
                    "BCH202",
                    "BTE312",
                    "BTE313",
                    "BTE315",
                    "BTE317",
                    "BTE403",
                    "BTE404",
                    "MIC304",
                    "MIC307",
                    "MIC309",
                    "MIC404",
                    "MIC405",
                    "MIC406",
                    "MIC407",
                    "MIC408",
                ],
            },
            {
                code: "MIC-ELECTIVE-4",
                name: "Pick one course from the provided options above",
                credits: 3,
                elective: true,
                alternatives: [
                    "BCH202",
                    "BTE312",
                    "BTE313",
                    "BTE315",
                    "BTE317",
                    "BTE403",
                    "BTE404",
                    "MIC304",
                    "MIC307",
                    "MIC309",
                    "MIC404",
                    "MIC405",
                    "MIC406",
                    "MIC407",
                    "MIC408",
                ],
            },
            {
                code: "MIC-ELECTIVE-5",
                name: "Pick one course from the provided options above",
                credits: 3,
                elective: true,
                alternatives: [
                    "BCH202",
                    "BTE312",
                    "BTE313",
                    "BTE315",
                    "BTE317",
                    "BTE403",
                    "BTE404",
                    "MIC304",
                    "MIC307",
                    "MIC309",
                    "MIC404",
                    "MIC405",
                    "MIC406",
                    "MIC407",
                    "MIC408",
                ],
            },
        ]
    },
    {
        section: "Final Requirement",
        credits: 6,
        description: "Internship and Thesis/Project (3 credits each).",
        courses: [
            { code: "MIC400", name: "Internship", credits: 3 },
            { code: "MIC450", name: "Thesis", credits: 3 }
        ]
    }
];

// ! Calculate total credits from curriculum
export function getTotalCredits(curriculum = microbiologyCurriculum) {
    return curriculum.reduce((sum, section) => sum + (section.credits || 0), 0);
}

// ! Pre-req override map
export const prerequisiteOverrides = {
    MIC101: null,
    BCH101: null,
    BCH102: null,
    MIC102: "MIC101",
    BCH201: "BCH101",
    MIC202: "BCH101",
    MIC203: "MIC101",
    MIC204: "BCH201",
    MIC206: "MIC101, BCH101",
    MIC300: "MIC204, MIC206",
    MIC301: "MIC300",
    MIC302: "MIC101",
    MIC303: "MIC203",
    MIC306: "BCH101, MIC102",
    MIC308: "MIC202",
    MIC310: "MIC206",
    MIC401: "MIC310",
    MIC402: "MIC300",
    MIC403: "MIC302",
    BTE401: "MIC401, CSE101",
    MIC155: null,
    MIC255: null,
    MIC355: null,
    MIC455: null,
    MIC304: "MIC202, MIC206",
    MIC307: "MIC302",
    BTE315: "MIC203",
    BTE312: "CSE101",
    BTE317: "STA101 OR STA201",
    MIC309: "MIC300",
    MIC404: "MIC206, MIC301",
    MIC405: "MIC203",
    MIC406: "MIC300",
    MIC407: "MIC204, MIC206",
    MIC408: "MIC203",
    BCH202: "BCH101",
    BTE313: "MIC203",
    BTE403: "MIC310",
    BTE404: "MIC308, MIC304",
    MIC400: null,
    MIC450: null
};

const allCurriculumCourseCodes = Array.from(
    new Set(
        microbiologyCurriculum.flatMap((section) => {
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

for (const code of allCurriculumCourseCodes) {
    if (!(code in prerequisiteOverrides)) {
        prerequisiteOverrides[code] = null;
    }
}