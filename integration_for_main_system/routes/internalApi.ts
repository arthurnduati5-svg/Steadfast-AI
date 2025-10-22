
import { Router, Request, Response } from 'express';
import { internalAuth } from '../middleware/internalAuth';

// ===================================================================================
//  ACTION REQUIRED FOR THE MAIN SCHOOL SYSTEM DEVELOPER
//
//  You must import your actual Prisma client here. The path below is a
//  placeholder and will depend on your project's folder structure.
//  Please verify and correct this import path.
//
//  EXAMPLE:
//  import prisma from '../lib/prisma';
// ===================================================================================
import prisma from '../path/to/your/prisma/client';


const router = Router();

/**
 * GET /api/students/:id
 *
 * An internal endpoint for the AI backend to securely fetch student details.
 * This route is protected by the `internalAuth` middleware.
 */
router.get('/students/:id', internalAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // ===============================================================================
    //  FINAL DATABASE LOGIC
    //
    //  This code queries your database for the student with the given ID.
    //
    //  ACTION REQUIRED:
    //  Verify that your student model is named 'user'. If it has a different name
    //  (e.g., 'student'), change `prisma.user` to `prisma.student` below.
    // ===============================================================================

    const student = await prisma.user.findUnique({
      where: { id: id },
      // The AI Backend requires these four fields to create a student profile.
      select: {
        id: true,
        name: true,
        email: true,
        grade: true, // If your model uses a different name like 'gradeLevel', please adjust.
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Return the real student data as a JSON object.
    return res.status(200).json(student);

  } catch (error) {
    console.error(`[Internal API] Error fetching student data for ID ${id}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
