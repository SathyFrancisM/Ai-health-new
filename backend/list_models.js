const axios = require('axios');
require('dotenv').config();

async function listModels() {
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        
        console.log("Supported Models:");
        response.data.models.forEach(m => {
            console.log(`- ${m.name}`);
        });
    } catch(e) {
        console.log("Error:", Object.keys(e));
        if (e.response) {
            console.log("Response data:", e.response.data);
            console.log("Response status:", e.response.status);
        }
    }
}

listModels();
