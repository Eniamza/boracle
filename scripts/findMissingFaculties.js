const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Fetching courses from CDN...");
        const cdnRes = await fetch('https://connect-cdn.itzmrz.xyz/backups/spring2026.json');

        if (!cdnRes.ok) {
            throw new Error(`CDN returned status: ${cdnRes.status}`);
        }

        let courses = await cdnRes.json();
        courses = courses.sections;

        // Sometimes the top level is an object like { sections: [] }
        if (!Array.isArray(courses) && courses.sections) {
            courses = courses.sections;
        }

        // Extract all faculties initials from course sections
        const cdnFaculties = new Set();
        courses.forEach(course => {
            if (course.faculties) {
                course.faculties.split(',').forEach(f => {
                    const initial = f.trim().toUpperCase();
                    if (initial && initial !== 'TBA') {
                        cdnFaculties.add(initial);
                    }
                });
            }
        });

        console.log(`Found ${cdnFaculties.size} unique faculty initials in CDN.`);

        console.log("Fetching existent faculties from local API...");
        const apiRes = await fetch('http://localhost:3000/api/faculty/lookup');
        const apiData = await apiRes.json();

        if (!apiData.success) {
            throw new Error("Failed to fetch from local API");
        }

        const knownFaculties = new Set(Object.keys(apiData.facultyMap || {}));
        console.log(`Found ${knownFaculties.size} known faculty initials in local DB.`);

        const missingFaculties = [];
        cdnFaculties.forEach(initial => {
            if (!knownFaculties.has(initial)) {
                missingFaculties.push(initial);
            }
        });

        missingFaculties.sort();
        console.log(`Identified ${missingFaculties.length} missing faculties.`);

        if (missingFaculties.length === 0) {
            console.log("All faculties are present in the DB. Nothing to do.");
            return;
        }

        console.log("Generating missing_faculties_template.csv ...");
        let csvContent = 'facultyName,email,imgURL,initials\n';

        missingFaculties.forEach(initial => {
            // Note: facultyName, email, and imgURL are intentionally left blank for the user to fill
            csvContent += `,"","",${initial}\n`;
        });

        const outputPath = path.join(__dirname, 'missing_faculties_template.csv');
        fs.writeFileSync(outputPath, csvContent, 'utf8');

        console.log(`\nCSV Generated successfully at: ${outputPath}`);
        console.log('You can now open this template, correct the Names and Emails, and import it from the Admin Panel.');
    } catch (err) {
        console.error("Error executing script:", err);
    }
}

main();
