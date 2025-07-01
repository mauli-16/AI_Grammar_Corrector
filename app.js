import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant" },
          { role: "user", content: `Correct this text: ${text}` },
        ],
        max_tokens: 100,
        temperature: 1,
      }),
    });

    const data = await response.json();
    const correctedText = data.choices?.[0]?.message?.content || "Could not get a correction.";

    res.render("index", {
      corrected: correctedText,
      originalText: text,
    });
  } catch (error) {
    res.render("index", {
      corrected: "Error. Please try again.",
      originalText: text,
    });
  }
});

// ✅ Required export
export default app;
