// backend/src/routes/chatRoutes.ts

import { Router } from 'express';
import prisma from '../utils/prismaClient';
import { authenticateStudent } from '../middleware/authMiddleware';

const router = Router();

// Middleware to apply authentication to all chat routes
router.use(authenticateStudent);

// POST /api/chat-sessions - Start a new chat session
router.post('/chat-sessions', async (req, res) => {
  const studentId = req.studentId; // From authenticated middleware
  const { topic, initialMessageContent } = req.body;

  if (!studentId) {
    return res.status(401).json({ message: 'Student not authenticated.' });
  }

  try {
    // First, verify the student exists in our DB (linked via externalId/userId)
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }, // Assuming userId in StudentProfile is the externalId from SMS
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const newSession = await prisma.chatSession.create({
      data: {
        studentId: studentProfile.userId, // Use the userId from StudentProfile as the link
        topic: topic || 'New Chat Session',
        messages: {
          create: initialMessageContent ? [{
            role: 'user',
            content: initialMessageContent,
            messageNumber: 1,
          }] : [],
        },
      },
      include: { messages: true },
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error starting chat session:', error);
    res.status(500).json({ message: 'Failed to start chat session.', error: error instanceof Error ? error.message : 'An unknown error occurred.' });
  }
});

// GET /api/chat-sessions/:sessionId - Retrieve a specific chat session with messages
router.get('/chat-sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const studentId = req.studentId;

  if (!studentId) {
    return res.status(401).json({ message: 'Student not authenticated.' });
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        studentId: studentId, // Ensure the session belongs to the authenticated student
      },
      include: { messages: { orderBy: { messageNumber: 'asc' } } },
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found or unauthorized.' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error retrieving chat session:', error);
    res.status(500).json({ message: 'Failed to retrieve chat session.', error: error instanceof Error ? error.message : 'An unknown error occurred.' });
  }
});

// GET /api/students/:studentId/chat-sessions - List all chat sessions for a student
// Note: studentId here should ideally come from the authenticated user, not params,
// but kept for flexibility if an admin might query.
router.get('/students/:studentId/chat-sessions', async (req, res) => {
  const studentIdFromAuth = req.studentId; // Authenticated student
  const { studentId: requestedStudentId } = req.params; // Student ID from URL

  // For strict security, ensure requestedStudentId matches studentIdFromAuth
  // unless the authenticated user has an 'admin' or 'teacher' role.
  if (!studentIdFromAuth || studentIdFromAuth !== requestedStudentId) {
    return res.status(403).json({ message: 'Unauthorized access to student sessions.' });
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { studentId: requestedStudentId },
      orderBy: { startTime: 'desc' },
      // Optionally include a snippet of the last message or topic
      include: { messages: { take: 1, orderBy: { messageNumber: 'desc' } } },
    });

    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error listing chat sessions:', error);
    res.status(500).json({ message: 'Failed to list chat sessions.', error: error instanceof Error ? error.message : 'An unknown error occurred.' });
  }
});

// POST /api/chat-sessions/:sessionId/messages - Add a new message to an existing session
// This route will be used to save both user input and AI responses.
router.post('/chat-sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  const studentId = req.studentId;
  const { role, content, metadata } = req.body;

  if (!studentId) {
    return res.status(401).json({ message: 'Student not authenticated.' });
  }
  if (!role || !content) {
    return res.status(400).json({ message: 'Message role and content are required.' });
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        studentId: studentId, // Ensure the session belongs to the authenticated student
      },
      include: { messages: { select: { messageNumber: true }, orderBy: { messageNumber: 'desc' }, take: 1 } },
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found or unauthorized.' });
    }

    // Determine the next message number
    const nextMessageNumber = session.messages.length > 0 ? session.messages[0].messageNumber + 1 : 1;

    const newMessage = await prisma.chatMessage.create({
      data: {
        sessionId: sessionId,
        role: role,
        content: content,
        messageNumber: nextMessageNumber,
        metadata: metadata || undefined,
      },
    });

    // Update the session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error adding message to chat session:', error);
    res.status(500).json({ message: 'Failed to add message to chat session.', error: error instanceof Error ? error.message : 'An unknown error occurred.' });
  }
});

export default router;
