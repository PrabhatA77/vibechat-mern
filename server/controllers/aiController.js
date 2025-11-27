import OpenAI from "openai";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";

export const initAIUser = async () => {
    try {
        const aiEmail = "chatgpt@vibechat.ai";
        const existingAI = await User.findOne({ email: aiEmail });

        if (!existingAI) {
            const hashedPassword = await bcrypt.hash("openai_secret_password", 10);
            await User.create({
                name: "ChatGPT",
                email: aiEmail,
                password: hashedPassword,
                isVerified: true,
                isAI: true,
                bio: "I am your AI assistant powered by OpenAI.",
                profilePic: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
            });
            console.log("ChatGPT user created.");
        } else {
            // Ensure isAI is true for existing user (migration)
            if (!existingAI.isAI) {
                existingAI.isAI = true;
                await existingAI.save();
                console.log("Updated existing ChatGPT user to be AI.");
            }
        }
    } catch (error) {
        console.error("Error initializing AI user:", error);
    }
};

export const getOpenAIResponse = async (text, imageUrl) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return "OPENAI_API_KEY is missing in server .env";
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const messages = [
            {
                role: "user",
                content: [
                    { type: "text", text: text || "What is in this image?" },
                ],
            },
        ];

        if (imageUrl) {
            messages[0].content.push({
                type: "image_url",
                image_url: {
                    url: imageUrl,
                },
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 500,
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error("OpenAI API Error:", error);
        return "Sorry, I cannot connect to AI right now.";
    }
};

