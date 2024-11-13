require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true,
  })
);
app.use(express.json());

let db;
MongoClient.connect(process.env.MONGODB_URI)
  .then((client) => {
    console.log("Conectado a MongoDB");
    db = client.db(process.env.DB_NAME);

    const authRoutes = require("./routes/authRoutes")(db);
    app.use("/api/auth", authRoutes);
  })
  .catch((error) => {
    console.error("Error conectando a MongoDB:", error);
  });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Error interno del servidor" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});