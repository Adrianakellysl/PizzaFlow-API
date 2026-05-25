const { expect } = require("chai");
const { request, app, resetarEstadoDeTeste } = require("./setup");

describe("BDD - Autorização por token JWT", () => {
  beforeEach(async () => {
    await resetarEstadoDeTeste();
  });

  it("CT-AUTH-001: deve retornar 401 quando acessar rota protegida sem token", async () => {
    const resposta = await request(app).get("/api/pedidos");

    expect(resposta.status).to.equal(401);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Token nao informado.");
  });

  it("CT-AUTH-002: deve retornar 401 quando token for inválido", async () => {
    const resposta = await request(app)
      .get("/api/pedidos")
      .set("Authorization", "Bearer token_invalido");

    expect(resposta.status).to.equal(401);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Token invalido ou expirado.");
  });

  it("CT-AUTH-003: deve retornar 401 quando Authorization nao comeca com Bearer", async () => {
    const resposta = await request(app)
      .get("/api/pedidos")
      .set("Authorization", "token_invalido");

    expect(resposta.status).to.equal(401);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Token nao informado.");
  });

  it("CT-AUTH-004: deve retornar 401 quando token expirado", async () => {
    const resposta = await request(app)
      .get("/api/pedidos")
      .set("Authorization", "Bearer token_expirado_fake");

    expect(resposta.status).to.equal(401);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Token invalido ou expirado.");
  });
});
