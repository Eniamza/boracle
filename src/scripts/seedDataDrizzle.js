// seed.js - PostgreSQL Seed Script for BRACU Oracle using Drizzle ORM
// Run with: node --experimental-specifier-resolution=node src/scripts/seedDataDrizzle.js
// Or add to package.json: "db:seed": "node src/scripts/seedDataDrizzle.js"

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/db/schema.js';

// Create a dedicated connection for seeding
const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const connection = postgres(connectionString, { ssl: 'require' });
const db = drizzle(connection, { schema });

// Helper function to generate BRACU email
function generateBracuEmail(name) {
  return `${name.toLowerCase().replace(/\s/g, '.')}@g.bracu.ac.bd`;
}

// Helper function to generate random semester
function generateSemester() {
  const seasons = ['SPRING', 'SUMMER', 'FALL'];
  const year = Math.floor(Math.random() * 5) + 22; // 22-26
  return `${seasons[Math.floor(Math.random() * 3)]}${year.toString().padStart(2, '0')}`;
}

// Helper function to generate course codes
function generateCourseCode() {
  const departments = ['CSE', 'EEE', 'MAT', 'PHY', 'ENG', 'BUS', 'ECO', 'MIC'];
  const dept = departments[Math.floor(Math.random() * departments.length)];
  const number = Math.floor(Math.random() * 400) + 100;
  return `${dept}${number}`;
}

// Helper to get current epoch time
function getCurrentEpoch() {
  return Math.floor(Date.now() / 1000);
}

// Helper to create base64 encoded arrays of section IDs
function encodeRoutine(sectionIds) {
  return Buffer.from(JSON.stringify(sectionIds)).toString('base64');
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding with Drizzle ORM...');

    // ===== 1. SEED USERINFO =====
    console.log('Seeding userinfo...');
    
    // First, insert the deleted user placeholder
    await db
      .insert(schema.userinfo)
      .values({
        email: 'deleted@g.bracu.ac.bd',
        userName: 'Deleted User',
        userRole: 'student',
        createdAt: getCurrentEpoch(),
      })
      .onConflictDoNothing();

    const users = [
      { email: generateBracuEmail('john.doe'), userName: 'John Doe', userRole: 'student' },
      { email: generateBracuEmail('jane.smith'), userName: 'Jane Smith', userRole: 'student' },
      { email: generateBracuEmail('admin.user'), userName: 'Admin User', userRole: 'admin' },
      { email: generateBracuEmail('mod.sarah'), userName: 'Sarah Moderator', userRole: 'moderator' },
      { email: generateBracuEmail('alice.wong'), userName: 'Alice Wong', userRole: 'student' },
      { email: generateBracuEmail('bob.johnson'), userName: 'Bob Johnson', userRole: 'student' },
      { email: generateBracuEmail('charlie.brown'), userName: 'Charlie Brown', userRole: 'student' },
      { email: generateBracuEmail('diana.prince'), userName: 'Diana Prince', userRole: 'moderator' },
      { email: generateBracuEmail('erik.magnus'), userName: 'Erik Magnus', userRole: 'student' },
      { email: generateBracuEmail('fiona.green'), userName: 'Fiona Green', userRole: 'student' }
    ];

    for (const user of users) {
      await db
        .insert(schema.userinfo)
        .values({
          email: user.email,
          userName: user.userName,
          userRole: user.userRole,
          createdAt: getCurrentEpoch(),
        })
        .onConflictDoNothing();
    }
    console.log(`Inserted ${users.length + 1} users`);

    // ===== 2. SEED FACULTY =====
    console.log('Seeding faculty...');
    
    const facultyData = [
      { 
        facultyName: 'Dr. Ahmed Rahman', 
        email: 'ahmed.rahman@bracu.ac.bd',
        imgUrl: 'https://example.com/faculty/ahmed.jpg',
        initials: ['ARN', 'AR']
      },
      { 
        facultyName: 'Dr. Sarah Khan', 
        email: 'sarah.khan@bracu.ac.bd',
        imgUrl: 'https://example.com/faculty/sarah.jpg',
        initials: ['SKH', 'SK']
      },
      { 
        facultyName: 'Prof. Michael Chen', 
        email: 'michael.chen@bracu.ac.bd',
        imgUrl: null,
        initials: ['MCH', 'MC']
      },
      { 
        facultyName: 'Dr. Fatima Begum', 
        email: 'fatima.begum@bracu.ac.bd',
        imgUrl: 'https://example.com/faculty/fatima.jpg',
        initials: ['FBG', 'FB']
      },
      { 
        facultyName: 'Prof. Robert Williams', 
        email: 'robert.williams@bracu.ac.bd',
        imgUrl: 'https://example.com/faculty/robert.jpg',
        initials: ['RWL', 'RW']
      }
    ];

    const facultyIds = [];
    for (const fac of facultyData) {
      const result = await db
        .insert(schema.faculty)
        .values({
          facultyName: fac.facultyName,
          email: fac.email,
          imgUrl: fac.imgUrl,
        })
        .returning({ facultyId: schema.faculty.facultyId });
      
      if (result && result[0]) {
        facultyIds.push(result[0].facultyId);
        
        // Insert initials for this faculty
        for (const initialValue of fac.initials) {
          await db
            .insert(schema.initial)
            .values({
              facultyId: result[0].facultyId,
              facultyInitial: initialValue,
            })
            .onConflictDoNothing();
        }
      }
    }
    console.log(`Inserted ${facultyData.length} faculty members with initials`);

    // ===== 3. SEED SAVED ROUTINES =====
    console.log('Seeding saved routines...');
    
    const routines = [
      {
        routineStr: encodeRoutine([180845, 180379, 179168, 179167, 179166]),
        email: users[0].email,
        semester: 'SPRING25'
      },
      {
        routineStr: encodeRoutine([180845, 179168, 179166]),
        email: users[1].email,
        semester: 'SPRING25'
      },
      {
        routineStr: encodeRoutine([180379, 179167, 180845, 179168]),
        email: users[4].email,
        semester: 'SPRING25'
      }
    ];

    for (const routine of routines) {
      await db
        .insert(schema.savedRoutine)
        .values({
          routineStr: routine.routineStr,
          email: routine.email,
          semester: routine.semester,
          createdAt: getCurrentEpoch(),
        });
    }
    console.log(`Inserted ${routines.length} saved routines`);

    // ===== 4. SEED COURSE SWAPS =====
    console.log('Seeding course swaps...');
    
    const swaps = [
      {
        isDone: false,
        uEmail: users[0].email,
        getSectionId: 180845,
      },
      {
        isDone: false,
        uEmail: users[1].email,
        getSectionId: 179168,
      },
      {
        isDone: true,
        uEmail: users[4].email,
        getSectionId: 179166,
      }
    ];

    const swapIds = [];
    for (const swap of swaps) {
      const result = await db
        .insert(schema.courseSwap)
        .values({
          isDone: swap.isDone,
          uEmail: swap.uEmail,
          getSectionId: swap.getSectionId,
          createdAt: getCurrentEpoch(),
        })
        .returning({ swapId: schema.courseSwap.swapId });
      
      if (result && result[0]) {
        swapIds.push(result[0].swapId);
      }
    }

    // Add asking sections for each swap
    const askingSections = [180379, 179167, 180845];
    for (let i = 0; i < swapIds.length; i++) {
      await db
        .insert(schema.askSectionId)
        .values({
          swapId: swapIds[i],
          askSectionId: askingSections[i],
        });
    }
    console.log(`Inserted ${swaps.length} course swaps with asking sections`);

    // ===== 5. SEED REVIEWS =====
    console.log('Seeding reviews...');
    
    const reviewIds = [];
    const postStates = ['pending', 'published', 'rejected'];
    
    for (let i = 0; i < 15; i++) {
      const review = {
        facultyId: facultyIds[i % facultyIds.length],
        uEmail: users[i % users.length].email,
        isAnon: i % 3 === 0,
        semester: generateSemester(),
        behaviourRating: Math.floor(Math.random() * 4) + 7,
        teachingRating: Math.floor(Math.random() * 5) + 6,
        markingRating: Math.floor(Math.random() * 6) + 5,
        section: (i % 9 + 1).toString(),
        courseCode: generateCourseCode(),
        reviewDescription: `This is a sample review ${i + 1}. The professor was very helpful and knowledgeable.`,
        postState: postStates[i % 3],
        createdAt: getCurrentEpoch(),
      };

      const result = await db
        .insert(schema.reviews)
        .values(review)
        .returning({ reviewId: schema.reviews.reviewId });
      
      if (result && result[0]) {
        reviewIds.push(result[0].reviewId);
      }
    }
    console.log(`Inserted ${reviewIds.length} reviews`);

    // ===== 6. SEED COURSE MATERIALS =====
    console.log('Seeding course materials...');
    
    const materialIds = [];
    for (let i = 0; i < 10; i++) {
      const material = {
        uEmail: users[i % users.length].email,
        materialUrl: `https://drive.google.com/file/d/sample${i + 1}/view`,
        courseCode: generateCourseCode(),
        semester: generateSemester(),
        postState: postStates[i % 3],
        postDescription: `Lecture notes and slides for week ${i + 1}. Very comprehensive material covering all topics.`,
        createdAt: getCurrentEpoch(),
      };

      const result = await db
        .insert(schema.courseMaterials)
        .values(material)
        .returning({ materialId: schema.courseMaterials.materialId });
      
      if (result && result[0]) {
        materialIds.push(result[0].materialId);
      }
    }
    console.log(`Inserted ${materialIds.length} course materials`);

    // ===== 7. SEED TARGETS =====
    console.log('Seeding targets...');
    
    const targetIds = [];
    
    // Add some reviews as targets
    for (let i = 0; i < Math.min(5, reviewIds.length); i++) {
      const result = await db
        .insert(schema.targets)
        .values({
          kind: 'review',
          refId: reviewIds[i],
        })
        .onConflictDoNothing()
        .returning({ uuid: schema.targets.uuid });
      
      if (result && result[0]) {
        targetIds.push(result[0].uuid);
      }
    }
    
    // Add some materials as targets
    for (let i = 0; i < Math.min(3, materialIds.length); i++) {
      const result = await db
        .insert(schema.targets)
        .values({
          kind: 'material',
          refId: materialIds[i],
        })
        .onConflictDoNothing()
        .returning({ uuid: schema.targets.uuid });
      
      if (result && result[0]) {
        targetIds.push(result[0].uuid);
      }
    }
    console.log(`Inserted ${targetIds.length} targets`);

    // ===== 8. SEED VOTES =====
    console.log('Seeding votes...');
    
    let voteCount = 0;
    
    // Generate votes for targets
    for (const targetId of targetIds) {
      // Each target gets 2-4 votes
      const numVotes = Math.floor(Math.random() * 3) + 2;
      const usedEmails = new Set();
      
      for (let i = 0; i < numVotes; i++) {
        let userIndex;
        do {
          userIndex = Math.floor(Math.random() * users.length);
        } while (usedEmails.has(users[userIndex].email));
        
        usedEmails.add(users[userIndex].email);
        
        const value = Math.random() > 0.3 ? 1 : -1;  // 70% upvotes, 30% downvotes
        
        await db
          .insert(schema.votes)
          .values({
            uEmail: users[userIndex].email,
            targetUuid: targetId,
            value: value,
            createdAt: getCurrentEpoch(),
          })
          .onConflictDoNothing();
        voteCount++;
      }
    }
    console.log(`Inserted ${voteCount} votes`);

    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  });
