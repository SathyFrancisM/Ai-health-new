const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../backend/.env' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    // There isn't a direct listModels in the standard SDK for some versions, 
    // but let's try to just generate a tiny bit of content with various model names.
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];
    
    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`Success with ${modelName}:`, result.response.text());
            break;
        } catch (e) {
            console.error(`Failed with ${modelName}:`, e.message);
        }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listModels();
