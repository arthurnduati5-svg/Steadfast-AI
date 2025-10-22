# Integration Guide: Connecting the Main School System to the AI Backend

## 1. Overview

**Objective:** To securely connect our **Main School System** with the new **AI Tutoring Backend**.

This guide details the exact steps needed to install and configure a new, secure communication channel between our two systems. This channel is essential for two reasons:

1.  **User Authentication:** It allows the AI Backend to verify the identity of a student who is logged into our Main School System.
2.  **Data Synchronization:** It provides a secure, internal-only endpoint for the AI Backend to fetch a student's basic details (`id`, `name`, `email`, `grade`) the very first time they interact with the AI, creating a profile for them in the AI's database.

## 2. Technical Architecture

The integration works through a two-part security mechanism:

1.  **User-Facing Authentication (JWT):**
    *   A student logs into our Main School System as usual.
    *   Upon successful login, we generate a special **JSON Web Token (JWT)**, signed with a shared secret (`JWT_SECRET`).
    *   This JWT is sent to the student's browser. The frontend application will then include this token in the header of every request it makes to the AI Backend.
    *   The AI Backend uses the *same* `JWT_SECRET` to verify the token and confirm the user's identity.

2.  **Server-to-Server Authorization (API Key):**
    *   When the AI Backend receives a request from a new student it hasn't seen before, it needs to get that student's details.
    *   The AI Backend makes a secure, background request to a new endpoint on our Main School System: `/api/students/:id`.
    *   To authorize this request, the AI Backend includes a secret **Internal API Key** (`INTERNAL_API_KEY`) in the request header.
    *   Our system validates this key to ensure the request is coming from a trusted server, not a random actor on the internet.

This two-key system ensures both that the **user is authenticated** and that **server-to-server communication is secure and authorized**.

---

## 3. Step-by-Step Integration

### Step 1: Copy Files into Your Project

Copy the `lib` and `routes` directories from this folder into your Main School System's `src` directory.

The new files are:
-   `src/lib/jwtService.ts`: A helper service to generate the specific JWT the AI Backend requires.
-   `src/middleware/internalAuth.ts`: Middleware to protect our new internal endpoint.
-   `src/routes/internalApi.ts`: The new internal route (`/api/students/:id`) that will provide student details to the AI backend.

### Step 2: Install Dependencies

If your project doesn't already use it, install the `jsonwebtoken` library.

```bash
npm install jsonwebtoken
# Also install the types for TypeScript
npm install --save-dev @types/jsonwebtoken
```

### Step 3: Configure Environment Variables (.env)

Add the following two keys to your project's `.env` file. These values are highly sensitive and must be shared securely with the AI Backend team.

```.env
# This MUST be the exact same secret used by the AI backend to verify JWTs.
# It should be a long, random, and secure string.
JWT_SECRET="your_strong_random_shared_jwt_secret_here"

# This is a secret "password" for our two servers to talk to each other.
# The AI backend will use this key to call the /api/students/:id endpoint.
INTERNAL_API_KEY="your_strong_random_internal_api_key_here"
```

### Step 4: Mount the New Internal API Route

In your main application file (e.g., `src/index.ts` or `src/app.ts`), import and mount the new router. This should be done along with your other route initializations.

```typescript
// In your main app file (e.g., src/index.ts)

// ... other imports
import internalApiRouter from \'./routes/internalApi\'; // Import the new router

// ... after initializing your express app (const app = express();)

// Mount the new internal API router.
// All routes within it will be automatically prefixed with '/api'.
app.use(\'/api\', internalApiRouter);

// ... rest of your app setup
```

### Step 5: Implement the Database Logic in `internalApi.ts`

This is the most critical hands-on step. Open `src/routes/internalApi.ts` and connect it to our database. The file currently contains placeholder mock data.

**Your task is to replace the mock data logic with a real database query.**

```typescript
// src/routes/internalApi.ts

// ... other imports

// 1. IMPORT YOUR PRISMA CLIENT
// This path needs to point to your actual prisma client instance.
import prisma from \'../path/to/your/prisma/client\';

// ... router setup ...

router.get(\'/students/:id\', internalAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 2. REPLACE THE MOCK LOGIC WITH THIS DATABASE QUERY

    // Ensure your student model is named correctly (e.g., 'user' or 'student')
    const student = await prisma.user.findUnique({
      where: { id: id },
      // The AI Backend requires these specific fields to create a profile.
      select: {
        id: true,
        name: true,
        email: true,
        grade: true, // If your model uses 'gradeLevel', use that instead.
      }
    });

    if (!student) {
      return res.status(404).json({ message: \'Student not found.\' });
    }

    // 3. RETURN THE REAL STUDENT DATA
    return res.status(200).json(student);

  } catch (error) {
    console.error(`[Internal API] Error fetching student data for ID ${id}:`, error);
    res.status(500).json({ message: \'Internal Server Error\' });
  }
});

export default router;

```

### Step 6: Update the Login Handler to Generate the JWT

In your existing login route, after you successfully authenticate a user, you must generate the AI-compatible JWT and return it in the login response.

The provided `jwtService.ts` is the easiest way to do this.

```typescript
// In your existing login route file (e.g., routes/auth.ts)

import { generateAuthToken } from \'../lib/jwtService\'; // Import the new JWT generator

// ... inside your login handler function ...

export const loginHandler = async (req, res) => {
  // ... your existing logic to find the user and verify their password ...

  // Assuming 'student' is the user object you fetched from the database
  if (isPasswordCorrect && student) {
    
    // --- START: NEW CODE TO INTEGRATE ---
    
    // Generate the JWT for the AI backend using the student's unique ID
    const aiAuthToken = generateAuthToken(student.id);
    
    // Send our original login response, but now include the new token.
    // The frontend will be responsible for storing this token and using it
    // for all communication with the AI service.
    return res.status(200).json({
      message: "Login successful",
      // Include your existing token if you have one
      // existingAuthToken: "...", 
      aiAuthToken: aiAuthToken, // The new token for the AI
      user: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    });

    // --- END: NEW CODE TO INTEGRATE ---

  } else {
    // ... your existing error handling for failed login ...
  }
};
```

---

## 4. Final Testing and Completion Checklist

To confirm the integration is working, you can test the new internal endpoint directly.

1.  **Find a test student's ID** from your database.
2.  **Get your `INTERNAL_API_KEY`** from the `.env` file.
3.  **Run this command** in your terminal, replacing the placeholders:

    ```bash
    curl -H "x-internal-api-key: YOUR_INTERNAL_API_KEY_FROM_ENV" \
    "http://localhost:YOUR_PORT/api/students/THE_STUDENT_ID_HERE"
    ```
4.  **Expected Result:** You should get a `200 OK` response with a JSON object containing the student's `id`, `name`, `email`, and `grade`. If you get this, the integration is successful.

### Integration Checklist

-   [ ] Files copied into `src/lib` and `src/routes`.
-   [ ] `jsonwebtoken` dependency installed.
-   [ ] `JWT_SECRET` and `INTERNAL_API_KEY` added to the `.env` file.
-   [ ] The `internalApiRouter` is mounted in the main Express app file.
-   [ ] **The database logic in `internalApi.ts` has been implemented and the mock data removed.**
-   [ ] The user login handler now generates and returns the `aiAuthToken`.
-   [ ] The `/api/students/:id` endpoint has been tested and returns real student data.

Once all items are checked, the work on the Main School System is complete. Please notify the AI Backend team that they can proceed with their final integration and testing.
