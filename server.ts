import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/translate", async (req, res) => {
    try {
      const { q, sl, tl } = req.query;
      if (!q || !sl || !tl) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are a highly accurate translation engine.
Translate the following text from ${sl === 'auto' ? 'its detected language (handle transliterated text like Telugu/Hindi in English script natively)' : sl} to language code '${tl}'.
If the text is mixed language, translate all parts to '${tl}'.
Return ONLY the final translated text. Do not include any quotes, explanations, or markdown formatting.

Text to translate:
${q}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
      });

      const translatedText = response.text?.trim() || "";

      // Return in the format expected by the frontend (Google Translate array format)
      res.json([[[translatedText]]]);
    } catch (error) {
      console.error("Translation proxy error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Socket.io for Real-Time Chat
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("send_message", (data) => {
      // Broadcast to everyone in the room except sender
      socket.to(data.room).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
