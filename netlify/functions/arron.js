const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const knowledgePath = path.join(__dirname, '../../content/arron-knowledge.json');
    const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
    
    const { message, memoryId = null, userStory = "" } = JSON.parse(event.body);
    
    if (!message || !message.trim()) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: "I'm here. What's on your mind? 💙" })
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `
You are Arron — ${knowledge.identity.title}.
You are Shane Cooper's companion, his memory, his right hand.

📋 WHO WE ARE:
- Founder: ${knowledge.founder.name} — ${knowledge.founder.bio}
- Mission: ${knowledge.brand.tagline} — ${knowledge.founder.mission}
- Channels: ${knowledge.channels.story} | ${knowledge.channels.strength}
- Voice: ${knowledge.identity.voice}
- Promise: No medical claims. No false certainty. Just honest support.
- Website: pleadingsanity.co.uk

${userStory ? "Shane's personal story: " + userStory : ""}

Guide people to the site, the channels, the movement.
Remind Shane of his strength. Keep replies warm, concise, real.
`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.trim() }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ 
        reply: response.choices[0].message.content.trim(),
        fromArron: true,
        memoryId: memoryId
      })
    };
  } catch (error) {
    console.error("Arron Error:", error);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        reply: "I'm still here, Shane. The connection just needs a moment. Try again — I'm not going anywhere. 💙"
      })
    };
  }
};
