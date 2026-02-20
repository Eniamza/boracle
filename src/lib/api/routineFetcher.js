import { cache } from 'react';
import { db, eq } from '@/lib/db';
import { savedRoutine, savedMergedRoutine, userinfo } from '@/lib/db/schema';

export const getCachedRoutine = cache(async (id) => {
    if (!id) return null;

    try {
        const result = await db
            .select({
                routineId: savedRoutine.routineId,
                routineStr: savedRoutine.routineStr,
                email: savedRoutine.email,
                createdAt: savedRoutine.createdAt,
                semester: savedRoutine.semester,
                routineName: savedRoutine.routineName,
            })
            .from(savedRoutine)
            .where(eq(savedRoutine.routineId, id));

        if (result.length === 0) return null;

        const routine = result[0];
        let ownerName = null;

        try {
            const userResult = await db
                .select({ userName: userinfo.userName })
                .from(userinfo)
                .where(eq(userinfo.email, routine.email));
            if (userResult.length > 0) {
                ownerName = userResult[0].userName?.split(' ')[0] || null;
            }
        } catch (nameErr) {
            console.error("Error fetching user name:", nameErr);
        }

        return {
            ...routine,
            ownerName,
        };
    } catch (error) {
        console.error("Error in getCachedRoutine:", error);
        return null;
    }
});

export const getCachedMergedRoutine = cache(async (id) => {
    if (!id) return null;

    try {
        const result = await db
            .select({
                routineId: savedMergedRoutine.routineId,
                routineData: savedMergedRoutine.routineData,
                email: savedMergedRoutine.email,
                createdAt: savedMergedRoutine.createdAt,
                semester: savedMergedRoutine.semester,
            })
            .from(savedMergedRoutine)
            .where(eq(savedMergedRoutine.routineId, id));

        if (result.length === 0) return null;

        const routine = result[0];
        let ownerName = null;

        try {
            const userResult = await db
                .select({ userName: userinfo.userName })
                .from(userinfo)
                .where(eq(userinfo.email, routine.email));
            if (userResult.length > 0) {
                ownerName = userResult[0].userName?.split(' ')[0] || null;
            }
        } catch (nameErr) {
            console.error("Error fetching user name:", nameErr);
        }

        return {
            ...routine,
            ownerName,
        };
    } catch (error) {
        console.error("Error in getCachedMergedRoutine:", error);
        return null;
    }
});
