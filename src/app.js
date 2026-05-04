require("dotenv").config();

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const swaggerDocument = require("../swagger.json");
const packageInfo = require("../package.json");

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS para permitir requisições de outras origens (ex: editor.swagger.io)
app.use(cors());

// Força o parsing de JSON mesmo se o Postman enviar como texto puro sem Header
app.use(express.json({ type: '*/*' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ erro: "JSON malformado ou invalido." });
  }
  next();
});

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
