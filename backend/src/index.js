require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const apiRoutes = require("./routes/api");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const reactBuildPath = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(reactBuildPath));

app.use("/api", apiRoutes);
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});
