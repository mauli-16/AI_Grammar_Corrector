import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const port = 5000;
const app = express();

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// EJS and form parsing
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    corrected: "",
    originalText: "",
  });
});

app.post("/", async (req, res) => {
  const text = req.body.text.trim();

  if (!text) {
    return res.render("index", {
      corrected: "Please enter some text to correct",
      originalText: "",
    });
  }

  try {
    // Get Gemini API key from environment variables
    // IMPORTANT: Ensure you have GEMINI_API_KEY in your .env file
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      return res.render("index", {
        corrected: "Server error: Gemini API key is missing.",
        originalText: text,
      });
    }

    // Gemini API endpoint for text generation (using gemini-2.0-flash model)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Payload structure for Gemini API request
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `Correct this text: ${text}` },
          ],
        },
      ],
      // Configuration for text generation, similar to OpenAI's parameters
      generationConfig: {
        maxOutputTokens: 100, // Maximum number of tokens in the generated response
        temperature: 0.7,     // Controls randomness (0.0-1.0). Lower values are more deterministic.
      },
    };

    // Make the API call to Gemini
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Gemini API Response:", JSON.stringify(data, null, 2));

    let correctedText = "Could not get a correction.";

    // Extract the corrected text from the Gemini API response
    // The response structure is different from OpenAI, so we navigate through `candidates`, `content`, and `parts`.
    if (data.candidates && data.candidates.length > 0 &&
        data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0) {
      correctedText = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      // If the API returns an error, display its message
      correctedText = `API Error: ${data.error.message || "Unknown error"}`;
      console.error("Gemini API Error:", data.error);
    }

    res.render("index", {
      corrected: correctedText,
      originalText: text,
    });
  } catch (error) {
    // Catch any network or parsing errors
    console.error("Fetch or parsing error:", error);
    res.render("index", {
      corrected: "Error. Please try again.",
      originalText: text,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

// ✅ Required export for the app
export default app;
