const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../services/authService");

function validarToken(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token nao informado." });
  }

  const token = cabecalho.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    return next();
  } catch (erro) {
    return res.status(401).json({ erro: "Token invalido ou expirado." });
  }
}

module.exports = validarToken;
