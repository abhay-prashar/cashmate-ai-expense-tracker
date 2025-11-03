require('dotenv').config();

const express = require('express');
const multer = require('multer');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth'); 

const router = express.Router();

// Multer config for handling image uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size (e.g., 10MB)

// --- START: NEW CREDENTIALS LOGIC ---
let visionClient;
if (process.env.GCP_CREDENTIALS_JSON) {
    // For production on Render: Parse the JSON from the environment variable
    try {
        const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
        visionClient = new ImageAnnotatorClient({ credentials });
    } catch (e) {
        console.error('Failed to parse GCP_CREDENTIALS_JSON:', e);
    }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // For local development: Use the JSON file path
    visionClient = new ImageAnnotatorClient();
} else {
    console.error('GCP credentials not found. Set GCP_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS');
}
// --- END: NEW CREDENTIALS LOGIC ---

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use your working model

// Define allowed categories for Gemini
const studentCategories = [
    "Food & Drinks", "Transport", "Stationery & Books", "Mobile Recharge & Bills",
    "Entertainment", "Shopping (Personal)", "Fees & Dues", "Health & Medical",
    "Gifts & Social", "Miscellaneous", "Pocket Money", "Internship/Part-time",
    "Scholarship", "Other Income"
];


// POST /api/receipt/process
router.post('/process', auth, upload.single('receiptImage'), async (req, res) => {
    // Check if file was uploaded
    if (!req.file) {
        return res.status(400).json({ msg: 'No receipt image uploaded.' });
    }

    try {
        // --- 1. OCR using Google Cloud Vision ---
        const [ocrResult] = await visionClient.textDetection(req.file.buffer);
        const receiptText = ocrResult.fullTextAnnotation?.text;

        if (!receiptText || receiptText.trim() === '') {
            return res.status(400).json({ msg: 'Could not read any text from the image.' });
        }


        // --- 2. Extract Details using Gemini ---
        const prompt = `
            You are an intelligent receipt processor for a student's expense tracker (CashMate).
            Analyze the following text extracted from a receipt.
            Your goal is to extract the **vendor name**, the **total amount** paid (look for 'Total', 'Amount Due', etc.), the **date** of the transaction, and suggest the most likely **category** from the provided list.

            Receipt Text:
            \`\`\`
            ${receiptText}
            \`\`\`

            Allowed Categories: ${studentCategories.join(', ')}

            Instructions:
            - Find the single most likely vendor/store name.
            - Find the final total amount paid. It should be a number. If multiple totals exist, pick the largest or most prominent one typically found at the end.
            - Find the transaction date (try formats like DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD Mon YYYY etc.). If found, format it strictly as YYYY-MM-DD. If no date is clearly identifiable, use null.
            - Suggest the *single* most appropriate category from the allowed list based on the vendor and items (if visible). Prioritize expense categories unless income is explicitly mentioned. If unsure, use 'Miscellaneous'.
            - Respond ONLY with a valid JSON object containing these keys: "vendorName" (string or null), "totalAmount" (number or null), "transactionDate" (string "YYYY-MM-DD" or null), "suggestedCategory" (string from the list).
            - Example Response: {"vendorName": "Campus Cafe", "totalAmount": 150.75, "transactionDate": "2025-10-28", "suggestedCategory": "Food & Drinks"}
            - If a value cannot be found, use null for that key, e.g., {"vendorName": null, ...}. Do not add any extra text outside the JSON object.
        `;

        const safetySettings = [ /* ... your safety settings ... */ ];
        const result = await geminiModel.generateContent({
             contents: [{ role: "user", parts: [{ text: prompt }] }],
             safetySettings,
             // Ensure Gemini responds with JSON
             generationConfig: { responseMimeType: "application/json" }
        });

      

        // Check and parse Gemini response
        let extractedData = {};
        if (result.response && result.response.candidates && result.response.candidates[0].content && result.response.candidates[0].content.parts[0].text) {
            try {
                 // The response text *should* be JSON because of responseMimeType
                 extractedData = JSON.parse(result.response.candidates[0].content.parts[0].text);
            } catch (parseError) {
                 console.error("Failed to parse Gemini JSON response:", parseError);
                 return res.status(500).json({ msg: 'AI could not process the receipt details correctly.' });
            }
        } else {
             console.warn("Gemini did not return expected data structure.");
             return res.status(500).json({ msg: 'AI analysis failed. Please try again or enter manually.' });
        }

        // --- 3. Send Extracted Data to Frontend ---
        res.json(extractedData);

    } catch (err) {
        console.error('Error processing receipt:', err);
        // Handle specific errors like Vision API errors, file size errors etc. if needed
        res.status(500).json({ msg: 'Server error processing receipt.' });
    }
});

module.exports = router;