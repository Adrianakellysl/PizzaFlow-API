const jwt = require("jsonwebtoken");
const usuarioMock = require("../data/usuario");

const JWT_SECRET = process.env.JWT_SECRET || "segredo-pizzaria-dev";
const JWT_EXPIRES_IN = "1h";

function validarLogin(email, senha) {
  if (!email || !senha) {
    return {
      sucesso: false,
      erro: "Email e senha sao obrigatorios.",
      status: 400,
    };
  }

  if (email !== usuarioMock.email || senha !== usuarioMock.senha) {
    return {
      sucesso: false,
      erro: "Email ou senha invalidos.",
      status: 400,
    };
  }

  const token = jwt.sign(
    { sub: usuarioMock.id, email: usuarioMock.email, nome: usuarioMock.nome },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { sucesso: true, token };
}

module.exports = {
  validarLogin,
  JWT_SECRET,
};
