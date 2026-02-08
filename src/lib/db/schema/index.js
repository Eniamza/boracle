// src/lib/db/schema/index.js - Barrel export for all schema definitions

// Enums
export {
  userRoleEnum,
  reviewStateEnum,
  postStateEnum,
  decisionEnum,
  modDecisionEnum,
} from './enums.js';

// Tables
export { userinfo } from './userinfo.js';
export { faculty } from './faculty.js';
export { initial } from './initial.js';
export { savedRoutine } from './savedRoutine.js';
export { savedMergedRoutine } from './savedMergedRoutine.js';
export { courseSwap } from './courseSwap.js';
export { askSectionId } from './askSectionId.js';
export { reviews } from './reviews.js';
export { courseMaterials } from './courseMaterials.js';
export { targets } from './targets.js';
export { votes } from './votes.js';
export { moderatesReview } from './moderatesReview.js';
export { moderatesCourseMaterials } from './moderatesCourseMaterials.js';
