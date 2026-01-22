import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { CONFIG } from '../config';

const STORAGE_KEYS = {
    THREADS: 'weather_chat_threads_v1',
    CURRENT_THREAD_ID: 'weather_chat_current_thread_id_v1',
};

const genId = () => Math.random().toString(36).slice(2, 9);

const createNewThread = (partial = {}) => ({
    id: partial.id ?? `thread-${Math.random().toString(16).slice(2)}-${Date.now()}`,
    title: partial.title ?? 'New chat',
    createdAt: partial.createdAt ?? new Date().toISOString(),
    messages: partial.messages ?? [],
});

const safeJsonParse = (text) => {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const extractStreamText = (payload) => {
    if (!payload) return '';

    // Common streaming shapes (best-effort)
    if (typeof payload === 'string') return payload;

    // { content: "..." }
    if (typeof payload.content === 'string') return payload.content;

    // { delta: "..." } or { delta: { content: "..." } }
    if (typeof payload.delta === 'string') return payload.delta;
    if (payload.delta && typeof payload.delta.content === 'string') return payload.delta.content;

    // { message: { content: "..." } }
    if (payload.message && typeof payload.message.content === 'string') return payload.message.content;

    // OpenAI-like: { choices: [{ delta: { content: "..." } }] }
    const choiceDelta = payload?.choices?.[0]?.delta?.content;
    if (typeof choiceDelta === 'string') return choiceDelta;

    return '';
};

export const useChat = () => {
    const [threads, setThreads] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.THREADS);
        const parsed = saved ? safeJsonParse(saved) : null;
        if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;
        return [createNewThread({ title: 'Chat 1' })];
    });
    const [currentThreadId, setCurrentThreadId] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_THREAD_ID);
        return saved || null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentThread = useMemo(() => {
        const found = threads.find(t => t.id === currentThreadId);
        return found ?? threads[0];
    }, [threads, currentThreadId]);

    const messages = currentThread?.messages ?? [];

    useEffect(() => {
        if (!currentThreadId && threads[0]?.id) {
            setCurrentThreadId(threads[0].id);
        }
    }, [currentThreadId, threads]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
    }, [threads]);

    useEffect(() => {
        if (currentThreadId) localStorage.setItem(STORAGE_KEYS.CURRENT_THREAD_ID, currentThreadId);
    }, [currentThreadId]);

    const audioRef = useRef(null);
    const lastPlayRef = useRef(0);

    const ensureAudioCtx = () => {
        if (!audioRef.current) {
            try {
                audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                audioRef.current = null;
            }
        }
        return audioRef.current;
    };

    const playNotification = (freq = 880, duration = 0.18, volume = 0.08) => {
        try {
            const audioCtx = ensureAudioCtx();
            if (!audioCtx) return;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // ignore audio errors (autoplay policies)
        }
    };

    const playChunkSound = () => {
        const now = Date.now();
        if (now - lastPlayRef.current < 100) return;
        lastPlayRef.current = now;
        const freq = 650 + Math.floor(Math.random() * 500);
        playNotification(freq, 0.06, 0.04);
    };

    const updateLastAgentMessage = useCallback((nextContent) => {
        setThreads(prev => prev.map(t => {
            if (t.id !== currentThread?.id) return t;
            const updated = [...t.messages];
            if (updated.length > 0) {
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: nextContent };
            }
            return { ...t, messages: updated };
        }));
    }, [currentThread?.id]);

    const clearChat = useCallback(() => {
        setThreads(prev => prev.map(t => (
            t.id === currentThread?.id ? { ...t, messages: [] } : t
        )));
    }, [currentThread?.id]);

    const addReaction = useCallback((messageId, emoji) => {
        setThreads(prev => prev.map(t => {
            if (t.id !== currentThread?.id) return t;
            const updated = t.messages.map(m => {
                if (m.id === messageId) {
                    // Toggle reaction: if already exists, remove it; if different, replace it. 
                    // Or complex: array of reactions. For simplicity & standard chat feel:
                    // If same emoji, remove. If new emoji, set it.
                    // Assuming 'reaction' field on message.
                    const currentReaction = m.reaction;
                    return { ...m, reaction: currentReaction === emoji ? null : emoji };
                }
                return m;
            });
            return { ...t, messages: updated };
        }));
    }, [currentThread?.id]);

    const createThread = useCallback(() => {
        const nextIndex = threads.length + 1;
        const newThread = createNewThread({ title: `Chat ${nextIndex}` });
        setThreads(prev => [newThread, ...prev]);
        setCurrentThreadId(newThread.id);
    }, [threads.length]);

    const deleteThread = useCallback((threadId) => {
        setThreads(prev => {
            const remaining = prev.filter(t => t.id !== threadId);
            return remaining.length > 0 ? remaining : [createNewThread({ title: 'Chat 1' })];
        });
        setCurrentThreadId(prevId => {
            if (prevId !== threadId) return prevId;
            const next = threads.find(t => t.id !== threadId);
            return next?.id ?? null;
        });
    }, [threads]);

    const renameThread = useCallback((threadId, title) => {
        setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, title } : t)));
    }, []);

    const switchThread = useCallback((threadId) => {
        setCurrentThreadId(threadId);
        setError(null);
    }, []);

    const sendMessage = async (content) => {
        if (!content.trim()) return;


        const userMessage = { id: genId(), role: 'user', content, timestamp: new Date().toISOString(), status: 'sending' };

        // Optimistically append user message + placeholder agent message in the current thread
        // Optimistically append user message + placeholder agent message in the current thread
        const agentMessage = { id: genId(), role: 'agent', content: '', timestamp: new Date().toISOString() };

        setThreads(prev => prev.map(t => (
            t.id === currentThread?.id
                ? { ...t, messages: [...t.messages, userMessage, agentMessage] }
                : t
        )));

        setLoading(true);
        setError(null);

        if (CONFIG.USE_MOCK) {
            setTimeout(async () => {
                // Generate contextual response based on question
                const question = content.toLowerCase();
                let mockResponses = [];

                // Detect location mentions
                const locations = ['london', 'mumbai', 'delhi', 'tokyo', 'new york', 'paris', 'sydney', 'dubai', 'singapore', 'bangkok'];
                const foundLocation = locations.find(loc => question.includes(loc));
                const location = foundLocation ? foundLocation.charAt(0).toUpperCase() + foundLocation.slice(1) : 'that area';

                // Detect question type and generate contextual responses
                const rainChance = Math.random() > 0.5 ? '30%' : '60%';
                const forecastType = Math.random() > 0.5 ? 'light showers expected in the afternoon' : 'mostly clear skies with occasional drizzle';
                const rainAdvice = Math.random() > 0.5 ? 'carrying an umbrella' : 'staying indoors during peak hours';
                const cloudCondition = Math.random() > 0.5 ? 'Partly cloudy' : 'Mostly sunny';
                const windType = Math.random() > 0.5 ? 'gentle breezes' : 'calm winds';
                const weekendOutlook = Math.random() > 0.5 ? 'pleasant for outdoor activities' : 'ideal for staying cozy indoors';
                const weekendEmoji = Math.random() > 0.5 ? '☀️' : '🌤️';
                const temp = Math.floor(Math.random() * 15) + 18;
                const tempFeel = temp > 25 ? 'quite warm' : temp < 20 ? 'mild and comfortable' : 'pleasant';
                const humidityFeel = Math.random() > 0.5 ? 'slightly muggy' : 'refreshing';
                const dressAdvice = temp > 25 ? 'lightly with breathable fabrics' : temp < 15 ? 'in layers to stay warm' : 'comfortably for the mild weather';
                const clothingSuggestion = Math.random() > 0.5 ? 'light layers' : 'comfortable casual wear';
                const clothingExtra = Math.random() > 0.5 ? 'a light jacket' : 'breathable fabrics';
                const accessoryAdvice = Math.random() > 0.5 ? 'Don\'t forget sunglasses' : 'Consider bringing an umbrella';
                const accessoryReason = Math.random() > 0.5 ? 'UV levels are moderate' : 'there might be occasional showers';
                const overallFeel = Math.random() > 0.5 ? 'perfect weather for outdoor activities!' : 'comfortable conditions for your plans';
                const windCondition = Math.random() > 0.5 ? 'calm' : 'moderate';
                const windDirection = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)];
                const windActivity = Math.random() > 0.5 ? 'Perfect for outdoor activities' : 'Great conditions for a walk';
                const breezeFeel = Math.random() > 0.5 ? 'refreshing and pleasant' : 'gentle and comfortable';
                const genericCondition = Math.random() > 0.5 ? 'partly cloudy' : 'mostly sunny';
                const genericWind = Math.random() > 0.5 ? 'Light winds' : 'Calm conditions';
                const genericActivity = Math.random() > 0.5 ? 'pleasant for outdoor activities' : 'ideal weather';
                const genericDetails = Math.random() > 0.5 ? 'the hourly forecast' : 'extended outlook';
                const genericEmoji = Math.random() > 0.5 ? '☀️' : '🌤️';

                if (question.includes('rain') || question.includes('raining') || question.includes('precipitation')) {
                    mockResponses = [
                        `Checking precipitation data for ${location}... `,
                        foundLocation ? `In ${location}, there's a ${rainChance} chance of rain today. ` : `There's a ${rainChance} chance of rain today. `,
                        `The forecast shows ${forecastType}. `,
                        `I'd recommend ${rainAdvice}. ☔`
                    ];
                } else if (question.includes('forecast') || question.includes('tomorrow') || question.includes('week') || question.includes('weekend')) {
                    mockResponses = [
                        `Let me pull up the extended forecast for ${location}... `,
                        `Over the next few days, expect temperatures ranging from ${Math.floor(Math.random() * 10) + 15}°C to ${Math.floor(Math.random() * 10) + 25}°C. `,
                        `${cloudCondition} conditions are expected, with ${windType}. `,
                        `The weekend looks ${weekendOutlook}. ${weekendEmoji}`
                    ];
                } else if (question.includes('temperature') || question.includes('hot') || question.includes('cold') || question.includes('warm')) {
                    mockResponses = [
                        `Current temperature in ${location} is around ${temp}°C. `,
                        `It feels ${tempFeel} with a real-feel of ${temp + Math.floor(Math.random() * 3) - 1}°C. `,
                        `The humidity is at ${Math.floor(Math.random() * 30) + 50}%, making it feel ${humidityFeel}. `,
                        `Dress ${dressAdvice}. 🌡️`
                    ];
                } else if (question.includes('wear') || question.includes('clothing') || question.includes('dress')) {
                    mockResponses = [
                        `Based on current conditions in ${location}... `,
                        `I'd suggest ${clothingSuggestion} with ${clothingExtra}. `,
                        `${accessoryAdvice} as ${accessoryReason}. `,
                        `Overall, ${overallFeel} 👕`
                    ];
                } else if (question.includes('wind') || question.includes('breeze')) {
                    mockResponses = [
                        `Wind conditions in ${location} are currently ${windCondition}. `,
                        `Wind speeds are around ${Math.floor(Math.random() * 15) + 5} km/h, coming from the ${windDirection}. `,
                        `${windActivity}. `,
                        `The breeze feels ${breezeFeel}. 💨`
                    ];
                } else {
                    // Generic weather response
                    mockResponses = [
                        `I've checked the weather conditions for ${location}! `,
                        `Currently, it's ${genericCondition} with temperatures around ${Math.floor(Math.random() * 10) + 18}°C. `,
                        `${genericWind} are expected, making it ${genericActivity}. `,
                        `Would you like more details about ${genericDetails}? ${genericEmoji}`
                    ];
                }

                let currentText = "";
                playNotification(900, 0.12, 0.06);

                // mark user message delivered when agent starts replying
                setThreads(prev => prev.map(t => {
                    if (t.id !== currentThread?.id) return t;
                    const updated = t.messages.map(m => m.id === userMessage.id ? { ...m, status: 'delivered', deliveredAt: new Date().toISOString() } : m);
                    return { ...t, messages: updated };
                }));

                for (const sentence of mockResponses) {
                    const words = sentence.split(' ');
                    for (const word of words) {
                        currentText += word + ' ';
                        updateLastAgentMessage(currentText);
                        playChunkSound();
                        await new Promise(resolve => setTimeout(resolve, CONFIG.MOCK_DELAY));
                    }
                }
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const requestMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json',
                    'x-mastra-dev-playground': 'true',
                },
                body: JSON.stringify({
                    messages: requestMessages,
                    runId: CONFIG.RUN_ID,
                    maxRetries: CONFIG.MAX_RETRIES,
                    maxSteps: CONFIG.MAX_STEPS,
                    temperature: CONFIG.TEMPERATURE,
                    topP: CONFIG.TOP_P,
                    runtimeContext: {
                        threadId: String(CONFIG.ROLL_NUMBER),
                        resourceId: CONFIG.RESOURCE_ID,
                        userId: CONFIG.USER_ID,
                    },
                }),
            });

            if (!response.ok) throw new Error('Failed to connect to weather agent');
            if (!response.body) throw new Error('Streaming not supported by this browser/response');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let accumulatedContent = '';
            let didNotify = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });
                buffer += chunkText;

                // Handle SSE-like streams: lines with "data: ..."
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith('data:')) {
                        const data = trimmed.replace(/^data:\s*/, '');
                        if (data === '[DONE]') continue;
                        const parsed = safeJsonParse(data);
                        const deltaText = extractStreamText(parsed) || (parsed ? '' : data);
                        if (deltaText) accumulatedContent += deltaText;
                    } else {
                        // Fallback: raw chunking
                        const parsed = safeJsonParse(trimmed);
                        const deltaText = extractStreamText(parsed) || (!parsed ? trimmed : '');
                        if (deltaText) accumulatedContent += deltaText;
                    }
                }

                if (!didNotify && accumulatedContent.length > 0) {
                    didNotify = true;
                    playNotification();

                    // mark user message delivered when streaming begins
                    setThreads(prev => prev.map(t => {
                        if (t.id !== currentThread?.id) return t;
                        const updated = t.messages.map(m => m.id === userMessage.id ? { ...m, status: 'delivered', deliveredAt: new Date().toISOString() } : m);
                        return { ...t, messages: updated };
                    }));
                }

                updateLastAgentMessage(accumulatedContent);
            }

        } catch (err) {
            const friendly =
                err?.message === 'Failed to fetch'
                    ? 'Unable to reach the weather agent. Please check your internet connection or try again later.'
                    : err?.message || 'Something went wrong while contacting the weather agent.';
            setError(friendly);
            // Remove the placeholder agent message on error (keep user's message)
            setThreads(prev => prev.map(t => {
                if (t.id !== currentThread?.id) return t;
                const updated = [...t.messages];
                if (updated[updated.length - 1]?.role === 'agent' && updated[updated.length - 1]?.content === '') {
                    updated.pop();
                }
                return { ...t, messages: updated };
            }));
        } finally {
            setLoading(false);
        }
    };

    return {
        threads,
        currentThreadId: currentThread?.id ?? null,
        messages,
        sendMessage,
        loading,
        error,
        clearChat,
        createThread,
        deleteThread,
        renameThread,
        renameThread,
        switchThread,
        addReaction,
    };
};
