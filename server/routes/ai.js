require('dotenv').config();

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/insights
router.post('/insights', auth, async (req, res) => {
  try {
    // --- START: CACHING LOGIC ---
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error(`User not found for ID: ${req.user.id}`);
      return res.status(404).json({ insights: '• Error: User account not found.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the current day

    let lastGeneratedDay = null;
    if (user.insightsLastGenerated) {
      lastGeneratedDay = new Date(user.insightsLastGenerated);
      lastGeneratedDay.setHours(0, 0, 0, 0);
    }

    // Check if insights were already generated today AND they are not empty
    if (lastGeneratedDay && lastGeneratedDay.getTime() === today.getTime() && user.cachedInsights) {
      return res.json({ insights: user.cachedInsights }); // Send the saved insights
    }
    // --- END: CACHING LOGIC ---

    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });

    if (transactions.length < 3) {
       // We don't save this "not enough data" message as a cache
       return res.json({ insights: '• Add a few more expenses or income entries to get detailed insights! 📊' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are CashMate, a sharp, no-fluff finance buddy for a college student in Chandigarh, India, managing limited pocket money.
      Analyze the user's transaction data. Your goal is to provide **3-4 HIGH-IMPACT, practical tips**. No filler, no long explanations, just smart advice.
      
      **CRITICAL RULES:**
      1. **NO SUMMARIES:** Do NOT waste an insight on summaries like "Income was ₹X, Spent was ₹Y" or "Saving ₹X + ₹Y = ₹Z". Every single insight MUST be a NEW, actionable tip.
      2. **BE EXTREMELY CONCISE:** 1-2 short sentences MAX per tip. Be direct.
      3. **USE THE DATA:** Look at transaction *descriptions* (like 'elante', 'chai') and *frequencies* (e.g., 5 times) to make your tips specific and smart. DO NOT make blind guesses about *why* (like "for lunch").
      4. **SHOW THE MATH:** All saving suggestions must include the calculated ₹ amount.
      5. **EASY LANGUAGE:** Use simple, everyday words.

      **Output Rules (Generate 3-4 Tips from these types):**
      - **Top Spend Action:** "🎯 Your biggest spend was ₹X on [Category]. Can you cut this by ~20% (that's ~₹Y) by [simple, practical action, e.g., 'swapping 2 cafe trips for the mess']?"
      - **Leak Stopper:** "💧 You bought [Item, e.g., 'Chai'] [N] times, costing ₹[Total]. Cutting back just [Number] a week saves ₹[Calculation]!"
      - **Location/Brand Alert:** "🛍️ That ₹[Amount] spend at [Vendor, e.g., 'elante'] was a big one. Was it a planned 'need' or an impulse 'want'?"
      - **Frequency Alert:** "👀 Your [Category] spending (₹X) came from [N] small purchases. It's the *frequency* that's adding up, not one big item!"
      - **Smart Swap:** "💡 Saw ₹X spent on [Item/Category, e.g., 'Food & Drinks']? [Cheaper alternative, e.g., 'Campus snacks'] are a good way to save."
      - **Tone:** Sharp, smart, friendly, direct. Use emojis (🎯, 💧, 💡, 🤔, 💰, 👀, 🛍️, 🚌).
      - **Currency:** ALWAYS use Indian Rupee symbol (₹).
      - **Format:** Respond ONLY with a single string, using "•" (unicode bullet point U+2022) to separate the tips. No extra text, newlines, greetings, or markdown.

      Here is the user's transaction data (use amounts as Rupees ₹):
    `;

    const dataString = JSON.stringify(transactions);
    const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ];

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }, { text: dataString }] }],
        safetySettings,
    });

    let insightsText = "• Sorry, couldn't generate specific insights this time. Try again later!";
    if (result.response && result.response.candidates && result.response.candidates.length > 0 && result.response.candidates[0].content && result.response.candidates[0].content.parts && result.response.candidates[0].content.parts.length > 0 && result.response.candidates[0].content.parts[0].text) {
      insightsText = result.response.candidates[0].content.parts[0].text;
      insightsText = insightsText.replace(/\n/g, ' ').replace(/\*/g, '').trim();
      
      // --- SAVE THE NEW INSIGHTS TO THE USER ---
      user.cachedInsights = insightsText;
      user.insightsLastGenerated = new Date(); // Store the exact generation time
      await user.save();

    } else {
       console.warn("Gemini response issue:", result.response?.candidates?.[0]?.finishReason || "No text generated");
       if (result.response?.promptFeedback?.blockReason) {
         console.warn("Blocked due to:", result.response.promptFeedback.blockReason);
         insightsText = "• Insights couldn't be generated due to content safety filters.";
       }
       return res.json({ insights: insightsText });
    }

    res.json({ insights: insightsText });

  } catch (err) {
    console.error('Error in /api/ai/insights:', err);
    res.status(500).json({ insights: '• Oops! An error occurred while generating insights. Please try again later. 🔧' });
  }
});

module.exports = router;

