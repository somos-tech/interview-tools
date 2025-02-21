require('dotenv').config();
const express = require('express');
const { AzureOpenAI } = require("openai");
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

const endpoint = process.env["AZURE_OPENAI_ENDPOINT"] || "<endpoint>";
const apiKey = process.env["AZURE_OPENAI_API_KEY"] || "<api key>";
const apiVersion = "2024-05-01-preview";
const deployment = "gpt-4o"; //This must match your deployment name.

// Initialize OpenAI client
const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

app.use(express.json());
app.use(express.static('public'));

app.use(cors());

// Route for chat completions with streaming
app.get('/chat', async (req, res) => {
    const messages = JSON.parse(req.query.messages);

    messages.unshift(
        { role: "system", content: "You are an interviewer for a tech job position" }
    );
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
        //TODO: streaming in azure openai
        const stream = await client.chat.completions.create({
            messages: messages,
            model: "gpt-4o",
            stream: true,
        });
        
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                // Send chunk to client
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        
        res.write('data: [DONE]\n\n');
    } catch (error) {
        console.error('Error:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`);
    } finally {
        res.end();
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});