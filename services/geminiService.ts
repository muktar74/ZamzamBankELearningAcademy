
import { GoogleGenAI, Type } from '@google/genai';
import { Module, QuizQuestion, AiMessage, Course } from '../types';

let ai: GoogleGenAI | null = null;

// Asynchronously initializes the GoogleGenAI client by fetching the API key
// from our secure serverless function. This function caches the client
// so the key is only fetched once.
const getAiClient = async (): Promise<GoogleGenAI> => {
    if (ai) {
        return ai;
    }
    try {
        const response = await fetch('/api/get-api-key');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch API key from server.');
        }
        const { apiKey } = await response.json();
        if (!apiKey) {
            throw new Error('API key was not returned from the server.');
        }
        ai = new GoogleGenAI({ apiKey });
        return ai;
    } catch (error) {
        console.error("Could not initialize AI Client:", error);
        throw new Error("Could not connect to the AI service. Please ensure the API key is configured correctly in the deployment settings.");
    }
};


interface GeneratedContent {
  description: string;
  modules: Omit<Module, 'id'>[];
}

export const generateCourseContent = async (topic: string): Promise<GeneratedContent> => {
 try {
    const aiClient = await getAiClient();
    const prompt = `Generate course content for a corporate e-learning platform. The topic is "${topic}".
The target audience is employees of Zamzam Bank, an Islamic financial institution.
The content should be professional, informative, and suitable for professional development in Islamic finance.
Provide a course description and 3 modules. Each module should have a title and detailed content.
Format the module content using simple HTML tags like <p>, <strong>, <ul>, and <li> for better readability.`;

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
            description: {
                type: Type.STRING,
                description: 'A comprehensive overview of the course topic.',
            },
            modules: {
                type: Type.ARRAY,
                description: 'An array of modules for the course.',
                items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                    type: Type.STRING,
                    description: 'The title of the module.',
                    },
                    content: {
                    type: Type.STRING,
                    description: 'The HTML content of the module.',
                    },
                },
                required: ['title', 'content'],
                },
            },
            },
            required: ['description', 'modules'],
        },
        },
    });

    const jsonStr = response.text.trim();
    const content: GeneratedContent = JSON.parse(jsonStr);
    return content;
 } catch (error) {
    console.error("Gemini API Error (generateCourseContent):", error);
    throw new Error(String(error) || "Failed to generate course content from AI. Please check your prompt and try again.");
 }
};


export const generateQuiz = async (courseContent: string): Promise<QuizQuestion[]> => {
  try {
    const aiClient = await getAiClient();
    const prompt = `Based on the following course content, generate a quiz with 3 multiple-choice questions.
Each question should have 4 options and one correct answer.
The questions should test understanding of the key concepts in the content.

Course Content:
---
${courseContent}
---
`;

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            description: 'A list of quiz questions.',
            items: {
            type: Type.OBJECT,
            properties: {
                question: {
                type: Type.STRING,
                description: 'The question text.',
                },
                options: {
                type: Type.ARRAY,
                description: 'A list of 4 possible answers (multiple choice).',
                items: {
                    type: 'STRING',
                },
                },
                correctAnswer: {
                type: Type.STRING,
                description:
                    'The correct answer, which must be one of the provided options.',
                },
            },
            required: ['question', 'options', 'correctAnswer'],
            },
        },
        },
    });

    const jsonStr = response.text.trim();
    const quiz: QuizQuestion[] = JSON.parse(jsonStr);
    return quiz;
  } catch(error) {
    console.error("Gemini API Error (generateQuiz):", error);
    throw new Error(String(error) || "Failed to generate quiz from AI. The provided content may be too short or unclear.");
  }
};

export const getAiChatResponse = async (history: AiMessage[], courseContext?: {title: string, description: string}): Promise<string> => {
    try {
        const aiClient = await getAiClient();
        let systemInstruction = "You are a helpful and knowledgeable assistant for Zamzam Bank's e-learning platform. Your expertise is in Islamic Finance Banking (IFB). Be friendly, professional, and provide clear explanations. You must not answer questions outside the scope of Islamic finance, banking, or the provided course context.";
        
        if (courseContext) {
            systemInstruction += `\n\nThe user is currently viewing the course "${courseContext.title}". Course description: "${courseContext.description}". Tailor your answers to be relevant to this course if possible.`;
        }
        
        const contents = history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {parts: contents},
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text;
    } catch(error) {
        console.error("Gemini API Error (getAiChatResponse):", error);
        throw new Error(String(error) || "Sorry, I'm having trouble connecting right now. Please try again later.");
    }
};

export const analyzeDiscussionTopics = async (discussionText: string): Promise<string[]> => {
    try {
        const aiClient = await getAiClient();
        const prompt = `Analyze the following discussion forum comments from a corporate e-learning course on Islamic Finance.
Identify and list up to 5 main topics, keywords, or questions that people are frequently talking about.
Ignore pleasantries, greetings, and generic comments. Focus on the core subject matter.
Return the result as a JSON array of strings. For example: ["Topic 1", "Topic 2", "Topic 3"].

Discussion Text:
---
${discussionText}
---
`;
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                description: 'A list of the top 5 discussion topics or keywords.',
                items: {
                type: 'STRING',
                },
            },
            },
        });

        const jsonStr = response.text.trim();
        const topics: string[] = JSON.parse(jsonStr);
        return topics;
    } catch(error) {
        console.error("Gemini API Error (analyzeDiscussionTopics):", error);
        throw new Error(String(error) || "Failed to analyze discussion topics. The AI service may be temporarily unavailable.");
    }
};
