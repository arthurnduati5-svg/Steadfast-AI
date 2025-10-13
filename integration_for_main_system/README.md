# Integration Guide for Main School System

Hello! This folder contains the necessary components to connect the **Main School System** with the new **AI Backend**.

Please follow these steps to integrate the files into your project.

### Step 1: Copy Files

Copy the entire contents of this folder (`routes` and `lib`) into your project's `src` directory.

The new files are:
- `src/routes/internalApi.ts`: A secure, internal-only API endpoint to provide student details to the AI Backend.
- `src/lib/jwtService.ts`: A service to generate the authentication token (JWT) that the AI Backend needs.

### Step 2: Install Dependency

If you don't already have it, install the `jsonwebtoken` library:

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

### Step 3: Configure Environment Variables

Add the following two secret keys to your `.env` file. These keys **must be shared securely** with the AI Backend developer.

```.env
# This MUST be the exact same secret used by the AI backend to verify JWTs.
# It should be a long, random, and secure string.
JWT_SECRET="your_strong_random_shared_jwt_secret_here"

# This is a secret "password" for our two servers to talk to each other.
# The AI backend will use this key to call the /api/students/:id endpoint.
INTERNAL_API_KEY="your_strong_random_internal_api_key_here"
```

### Step 4: Integrate the New Internal API Route

In your main application file (e.g., `src/index.ts` or `src/app.ts`), you need to import and mount the new router for the internal API.

```typescript
// In your main app file (e.g., src/index.ts)

// ... other imports
import internalApiRouter from './routes/internalApi'; // Import the new router

// ... after initializing your express app (const app = express();)

// Mount the new internal API router
app.use('/api', internalApiRouter);

// ... rest of your app setup (other routes, server listen, etc.)
```

### Step 5: Integrate JWT Generation into Your Login Logic

In your existing user login route, after you have successfully verified a student's password and have their user object, you need to generate a JWT and send it back to the frontend.

Modify your login function to use the new `jwtService`.

```typescript
// In your existing login route file (e.g., routes/auth.ts)

import { generateAuthToken } from '../lib/jwtService'; // Import the new JWT generator

// ... inside your login handler function ...

export const loginHandler = async (req, res) => {
  // ... your existing logic to find the user and verify their password ...

  // Assuming 'student' is the user object you fetched from the database
  if (isPasswordCorrect && student) {
    
    // --> START: NEW CODE TO INTEGRATE <--
    
    // Generate the JWT using the student's unique ID
    const token = generateAuthToken(student.id);
    
    // Send the token back to the frontend along with any other user data
    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    });

    // --> END: NEW CODE TO INTEGRATE <--

  } else {
    // ... your existing error handling for failed login ...
  }
};
```

### Step 6: Test the Integration

Once the steps above are complete, restart your server and test the new endpoint using `curl` or Postman to confirm it's working before the AI team connects to it.

1.  **Find a test student's ID** from your database.
2.  **Run this command** in your terminal, replacing the placeholders:

    ```bash
    curl -H "x-internal-api-key: YOUR_INTERNAL_API_KEY_FROM_ENV" \
    "http://localhost:YOUR_PORT/api/students/THE_STUDENT_ID_HERE"
    ```
3.  **Expected result:** You should get a `200 OK` status with the student's details in JSON format.

If the test is successful, the integration is complete!
