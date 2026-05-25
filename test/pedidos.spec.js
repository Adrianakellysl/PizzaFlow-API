const { expect } = require("chai");
const { request, app, obterTokenValido, resetarEstadoDeTeste } = require("./setup");

describe("BDD - Criacao e consulta de pedidos", () => {
  let token;
  let pedidoId;

  beforeEach(async () => {
    await resetarEstadoDeTeste();
    token = await obterTokenValido();
    
    // Cria um pedido padrão para testes que necessitam de um pedido já existente
    const res = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Cliente Setup",
        itens: [{ nome: "Pizza Calabresa", quantidade: 1 }],
      });
    pedidoId = res.body.id;
  });

  it("CT-PED-001: deve criar pedido valido com calculo automatico de total", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Maria Oliveira",
        itens: [
          { nome: "Pizza Calabresa", quantidade: 1 },
          { nome: "Refrigerante", quantidade: 2 },
        ],
      });

    expect(resposta.status).to.equal(201);
    expect(resposta.body.id).to.be.a("number");
    expect(resposta.body.status).to.equal("recebido");
    expect(resposta.body.total).to.equal(61);
    expect(resposta.body.itens[0].precoUnitario).to.equal(45);
    expect(resposta.body.itens[1].precoUnitario).to.equal(8);
  });

  it("CT-PED-002: deve retornar 400 ao criar pedido sem cliente", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        itens: [{ nome: "Pizza Calabresa", quantidade: 1 }],
      });

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Campo cliente e obrigatorio.");
  });

  it("CT-PED-003: deve retornar 400 ao criar pedido sem itens", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Maria Oliveira",
      });

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Campo itens e obrigatorio e deve ser um array.");
  });

  it("CT-PED-004: deve retornar 400 ao criar pedido com itens vazio", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Maria Oliveira",
        itens: [],
      });

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("O pedido deve ter pelo menos 1 item.");
  });

  it("CT-PED-005: deve retornar 400 ao criar pedido com quantidade zero", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Maria Oliveira",
        itens: [{ nome: "Pizza Calabresa", quantidade: 0 }],
      });

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Cada item deve ter quantidade maior que zero.");
  });

  it("CT-PED-006: deve retornar 400 ao criar pedido com item inexistente", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Maria Oliveira",
        itens: [{ nome: "Pizza Inexistente", quantidade: 1 }],
      });

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Item 'Pizza Inexistente' nao existe no cardapio.");
  });

  it("CT-PED-007: deve ignorar preco enviado e usar o valor do cardapio", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Maria Oliveira",
        itens: [{ nome: "Pizza Calabresa", quantidade: 1, preco: 1 }],
      });

    expect(resposta.status).to.equal(201);
    expect(resposta.body.itens[0].precoUnitario).to.equal(45);
    expect(resposta.body.total).to.equal(45);
  });

  it("CT-PED-008: deve buscar pedido existente por ID", async () => {
    const resposta = await request(app)
      .get(`/api/pedidos/${pedidoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).to.equal(200);
    expect(resposta.body.id).to.equal(pedidoId);
  });

  it("CT-PED-009: deve retornar 404 ao buscar pedido inexistente", async () => {
    const resposta = await request(app)
      .get("/api/pedidos/9999")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).to.equal(404);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Pedido nao encontrado.");
  });

  it("CT-PED-010: deve listar pedidos", async () => {
    const resposta = await request(app)
      .get("/api/pedidos")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).to.equal(200);
    expect(resposta.body).to.be.an("array");
    expect(resposta.body.length).to.be.greaterThan(0);
  });

  it("CT-PED-011: deve atualizar pedido com PUT e recalcular total", async () => {
    const resposta = await request(app)
      .put(`/api/pedidos/${pedidoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Maria Oliveira Atualizada",
        itens: [
          { nome: "Pizza Mussarela", quantidade: 2 },
          { nome: "Refrigerante", quantidade: 1, preco: 1 },
        ],
      });

    expect(resposta.status).to.equal(200);
    expect(resposta.body.cliente).to.equal("Maria Oliveira Atualizada");
    expect(resposta.body.itens[0].precoUnitario).to.equal(40);
    expect(resposta.body.itens[1].precoUnitario).to.equal(8);
    expect(resposta.body.total).to.equal(88);
  });

  it("CT-PED-012: deve excluir pedido com DELETE", async () => {
    const excluirResposta = await request(app)
      .delete(`/api/pedidos/${pedidoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(excluirResposta.status).to.equal(204);
    expect(excluirResposta.body).to.be.empty;

    const buscaResposta = await request(app)
      .get(`/api/pedidos/${pedidoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(buscaResposta.status).to.equal(200);
    expect(buscaResposta.body.status).to.equal("cancelado");
  });

  it("CT-PED-013: deve retornar 404 ao editar pedido inexistente", async () => {
    const resposta = await request(app)
      .put("/api/pedidos/9999")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Nao Existe",
        itens: [{ nome: "Pizza Calabresa", quantidade: 1 }],
      });

    expect(resposta.status).to.equal(404);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Pedido nao encontrado.");
  });

  it("CT-PED-014: deve retornar 404 ao excluir pedido inexistente", async () => {
    const resposta = await request(app)
      .delete("/api/pedidos/9999")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).to.equal(404);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Pedido nao encontrado.");
  });

  it("CT-PED-015: deve manter IDs unicos apos excluir e criar novo pedido", async () => {
    // pedidoId ja existe, vamos criar B
    const pedidoB = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Cliente ID B",
        itens: [{ nome: "Pizza Mussarela", quantidade: 1 }],
      });

    // Exclui o initial pedidoId
    await request(app)
      .delete(`/api/pedidos/${pedidoId}`)
      .set("Authorization", `Bearer ${token}`);

    const pedidoC = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        cliente: "Cliente ID C",
        itens: [{ nome: "Refrigerante", quantidade: 1 }],
      });

    expect(pedidoB.status).to.equal(201);
    expect(pedidoC.status).to.equal(201);
    expect(pedidoId).to.be.lessThan(pedidoB.body.id);
    expect(pedidoB.body.id).to.be.lessThan(pedidoC.body.id);
  });
});
