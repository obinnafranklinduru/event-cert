require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 8000;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (CORS) for all routes.
app.use(cors());
// Enable the Express middleware to parse JSON-formatted request bodies.
app.use(express.json());

// --- API Routes ---
// All API routes are prefixed with '/api'.
app.use("/api", apiRoutes);

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.send("Event Certificate Backend is running!");
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});
