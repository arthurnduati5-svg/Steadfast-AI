# Task 024 Operations Privacy Guard

## Functionality
- Recursively strips forbidden fields
- Does not mutate input object
- Returns removed field names and safe reason codes
- All diagnostics pass through guard
- All reports pass through guard

## Forbidden Fields
- DATABASE_URL, REDIS_URL, JWT_SECRET, SESSION_SECRET, COOKIE_SECRET
- API keys (OPENAI, ANTHROPIC, GEMINI, GOOGLE, PINECONE)
- PRIVATE_KEY, ACCESS_TOKEN, REFRESH_TOKEN, ID_TOKEN, AUTHORIZATION, COOKIE
- rawBackupFile, rawDatabaseDump, rawRestorePayload, rawEnv, rawSecret
- rawConnectionString, rawStudentData, rawLearnerData, rawParentData, rawTeacherData
- rawChat, rawMessage, rawStudentAnswer, rawStudentWork
- safeguardingRaw, safeguardingCaseNote, privateDeenText, deenSensitiveRaw
- providerPrompt, providerResponse, rawProviderResponse
- chainOfThought, hiddenReasoning, scratchpad
- answerKey, correctAnswer, modelAnswer, markingScheme
- incidentRawLog, stackTraceWithSecrets
