require("dotenv").config();

const express = require("express");
const routes = require("./routes");
const swaggerDocument = require("../swagger.json");
const packageInfo = require("../package.json");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", routes);

app.get("/api/docs/swagger.json", (req, res) => {
  res.status(200).json(swaggerDocument);
});

app.get("/", (req, res) => {
  res.status(200).json({
    mensagem: "PizzaFlow API online.",
    sistema: "PizzaFlow API",
    versao: packageInfo.version,
    ambiente: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ erro: "Rota nao encontrada." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
