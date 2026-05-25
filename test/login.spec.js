const { expect } = require("chai");
const { request, app, resetarEstadoDeTeste } = require("./setup");

describe("BDD - Autenticacao na API", () => {
  beforeEach(async () => {
    await resetarEstadoDeTeste();
  });

  it("CT-LOGIN-001: deve retornar 200 e token ao realizar login com credenciais válidas", async () => {
    const resposta = await request(app).post("/api/login").send({
      email: "admin@pizzaria.com",
      senha: "123456",
    });

    expect(resposta.status).to.equal(200);
    expect(resposta.body).to.have.property("token").that.is.a("string").and.not.empty;
  });

  it("CT-LOGIN-002: deve retornar 400 quando login for sem email", async () => {
    const resposta = await request(app).post("/api/login").send({
      senha: "123456",
    });

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Email e senha sao obrigatorios.");
  });

  it("CT-LOGIN-003: deve retornar 400 quando login for sem senha", async () => {
    const resposta = await request(app).post("/api/login").send({
      email: "admin@pizzaria.com",
    });

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Email e senha sao obrigatorios.");
  });

  it("CT-LOGIN-004: deve retornar 401 quando credenciais forem invalidas", async () => {
    const resposta = await request(app).post("/api/login").send({
      email: "admin@pizzaria.com",
      senha: "senha_errada",
    });

    expect(resposta.status).to.equal(401);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Email ou senha invalidos.");
  });
});
