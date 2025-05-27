"use server";

import { getUser } from "@/auth/server";
import { handleError } from "@/lib/utils";
import { prisma } from "@/prisma/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const createNoteAction = async (noteId: string) => {
    try {
        const user = await getUser();
        if (!user) throw new Error("You must be logged in to create a note");

        await prisma.note.create({
            data: {
                id: noteId,
                authorId: user.id,
                text: "",
            },
        });

        return { errorMessage: null };
    } catch (error) {
        return handleError(error);
    }
};

export const updateNoteAction = async (noteId: string, text: string) => {
    try {
        const user = await getUser();
        if (!user) throw new Error("You must be logged in to update a note");

        await prisma.note.update({
            where: { id: noteId },
            data: { text },
        });

        return { errorMessage: null };
    } catch (error) {
        return handleError(error);
    }
};

export const deleteNoteAction = async (noteId: string) => {
    try {
        const user = await getUser();
        if (!user) throw new Error("You must be logged in to delete a note");

        await prisma.note.delete({
            where: { id: noteId, authorId: user.id },
        });

        return { errorMessage: null };
    } catch (error) {
        return handleError(error);
    }
};

export const askAIAboutNotesAction = async (
    newQuestions: string[],
    responses: string[],
) => {
    try {
        const user = await getUser();
        if (!user) throw new Error("You must be logged in to ask AI questions");

        const notes = await prisma.note.findMany({
            where: { authorId: user.id },
            orderBy: { createdAt: "desc" },
            select: { text: true, createdAt: true, updatedAt: true },
        });

        if (notes.length === 0) {
            return "You don't have any notes yet.";
        }

        const formattedNotes = notes
            .map((note) =>
                `
                    Text: ${note.text}
                    Created at: ${note.createdAt}
                    Last updated: ${note.updatedAt}
                `.trim(),
            ).join("\n");

        // Get the Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build the conversation history
        const conversationHistory = [];
        for (let i = 0; i < newQuestions.length - 1; i++) {
            conversationHistory.push(`Human: ${newQuestions[i]}`);
            if (responses.length > i) {
                conversationHistory.push(`Assistant: ${responses[i]}`);
            }
        }

        const systemPrompt = `
            You are a helpful assistant that answers questions about a user's notes. 
            Assume all questions are related to the user's notes. 
            Make sure that your answers are not too verbose and you speak succinctly. 

            IMPORTANT: Your responses MUST be formatted in clean, valid HTML with proper structure. 
            Use tags like <p>, <strong>, <em>, <ul>, <ol>, <li>, <h1> to <h6>, and <br> when appropriate. 
            Do NOT wrap the entire response in a single <p> tag unless it's a single paragraph. 
            Avoid inline styles, JavaScript, or custom attributes.
            DO NOT use markdown formatting or wrap your response in code blocks like \`\`\`html.
            Return ONLY the HTML content, nothing else.

            The HTML will be rendered like this in JSX:
            <p dangerouslySetInnerHTML={{ __html: YOUR_RESPONSE }} />

            Here are the user's notes:
            ${formattedNotes}

            ${conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.join('\n')}\n` : ''}
        `;

        const currentQuestion = newQuestions[newQuestions.length - 1];
        const prompt = `${systemPrompt}\nCurrent question: ${currentQuestion}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let responseText = response.text() || "A problem has occurred";

        // Clean up markdown code blocks that Gemini might add
        responseText = responseText.replace(/```html\n?/g, '').replace(/```\n?/g, '');

        return responseText;
    } catch (error) {
        console.error("Error in askAIAboutNotesAction:", error);
        return "A problem has occurred";
    }
};