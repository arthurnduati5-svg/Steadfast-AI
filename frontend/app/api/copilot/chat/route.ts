import { NextRequest, NextResponse } from 'next/server';
import { emotionalAICopilot } from '@/ai/flows/emotional-ai-copilot';

/**
 * World-Class SSE Contract for Steadfast AI
 * Part A: Next.js API Route Handler
 */
export async function POST(req: NextRequest) {
    const {
        currentSessionId,
        message,
        chatHistory,
        conversationState,
        fileData,
        forceWebSearch,
        includeVideos,
        preferences,
        studentMemory
    } = await req.json();

    const encoder = new TextEncoder();
    const token = req.headers.get('Authorization');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

    const stream = new ReadableStream({
        async start(controller) {
            // Helper to send typed events
            const sendEvent = (type: 'token' | 'done' | 'error', content: any) => {
                const data = JSON.stringify(type === 'token' ? { type, content } : { type, ...content });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            };

            try {
                let fullContent = "";
                let tokensStreamed = 0;

                // 1. Call the AI Brain
                const aiResult = await emotionalAICopilot({
                    text: message,
                    chatHistory,
                    state: conversationState,
                    studentProfile: {
                        name: preferences?.name || 'Student',
                        gradeLevel: preferences?.gradeLevel
                    },
                    preferences: {
                        preferredLanguage: preferences?.preferredLanguage,
                        interests: preferences?.interests
                    },
                    fileData,
                    forceWebSearch,
                    includeVideos,
                    memory: studentMemory,
                    onToken: (token) => {
                        fullContent += token;
                        tokensStreamed++;
                        sendEvent('token', token);
                    }
                });

                // 2. Simulated Streaming Fallback
                // If AI returned instantly without calling onToken (or if we want to ensure pacing)
                if (tokensStreamed === 0 && aiResult.processedText) {
                    const text = aiResult.processedText;
                    fullContent = text;

                    // Word+Space chunks for a buttery smooth "captivating" feel
                    const chunks = text.match(/(\S+\s*)/g) || [text];
                    for (const chunk of chunks) {
                        sendEvent('token', chunk);
                        // Natural typing delay: 15-25ms
                        await new Promise(r => setTimeout(r, Math.random() * 10 + 15));
                    }
                }

                // 3. Emit Final Metadata
                sendEvent('done', {
                    metadata: {
                        finalText: fullContent || aiResult.processedText,
                        state: aiResult.state,
                        suggestedTitle: aiResult.suggestedTitle,
                        video: aiResult.videoData,
                        sources: aiResult.sources
                    }
                });

                // 4. Background Persistence (Non-blocking)
                (async () => {
                    try {
                        const payloadBase = { sessionId: currentSessionId, conversationState: aiResult.state };

                        // Save User Message
                        await fetch(`${backendUrl}/api/copilot/message`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': token || '' },
                            body: JSON.stringify({
                                ...payloadBase,
                                message: { role: 'user', content: message, timestamp: new Date() }
                            })
                        });

                        // Save AI Message
                        await fetch(`${backendUrl}/api/copilot/message`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': token || '' },
                            body: JSON.stringify({
                                ...payloadBase,
                                message: {
                                    role: 'model',
                                    content: fullContent || aiResult.processedText,
                                    timestamp: new Date(),
                                    videoData: aiResult.videoData
                                }
                            })
                        });
                    } catch (err) {
                        console.error("[Persistence Error]", err);
                    }
                })();

                controller.close();
            } catch (error: any) {
                console.error("[SSE Route Error]", error);
                sendEvent('error', { content: error.message || "An unexpected error occurred." });
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
