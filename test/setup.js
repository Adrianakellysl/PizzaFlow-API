const request = require("supertest");
const app = require("../src/app");
const pedidoService = require("../src/services/pedidoService");

const credenciaisValidas = {
  email: "admin@pizzaria.com",
  senha: "123456",
};

const pedidoPadrao = {
  cliente: "Maria Oliveira",
  itens: [{ nome: "Pizza Calabresa", quantidade: 1 }],
};

async function obterTokenValido() {
  const resposta = await request(app).post("/api/login").send(credenciaisValidas);
  return resposta.body.token;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function postPedido(token, payload = pedidoPadrao) {
  return request(app).post("/api/pedidos").set(authHeader(token)).send(payload);
}

async function resetarEstadoDeTeste() {
  await pedidoService.resetarDadosPedidos();
}

after(async () => {
  const { isDatabaseConfigured } = require("../src/config/database");
  if (isDatabaseConfigured()) {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
  }
});

module.exports = {
  request,
  app,
  obterTokenValido,
  resetarEstadoDeTeste,
  authHeader,
  postPedido,
  pedidoPadrao,
};
