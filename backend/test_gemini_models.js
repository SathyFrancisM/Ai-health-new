require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test different model names
    const modelsToTry = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    
    for (const name of modelsToTry) {
        console.log(`\nTesting model: ${name}`);
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const res = await model.generateContent("Hello?");
            console.log("Success! Extracted text:", res.response.text());
        } catch(e) {
            console.log("Failed:", e.message);
        }
    }
}

checkModels();
