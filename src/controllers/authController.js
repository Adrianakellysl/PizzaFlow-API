const authService = require("../services/authService");
const { validarBody } = require("../helpers/validators");

function login(req, res) {
  if (!validarBody(req, res, "Body não enviado.")) {
    return;
  }

  const { email, senha } = req.body;
  const resultado = authService.validarLogin(email, senha);

  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(200).json({
    mensagem: "Login realizado com sucesso.",
    token: resultado.token,
  });
}

module.exports = {
  login,
};
