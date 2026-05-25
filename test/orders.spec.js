const { expect } = require("chai");
const { request, app, obterTokenValido, resetarEstadoDeTeste, authHeader, postPedido, pedidoPadrao } = require("./setup");

describe("BDD - Orders", () => {
  let token;

  beforeEach(async () => {
    resetarEstadoDeTeste();
    token = await obterTokenValido();
  });

  async function criarPedido(cliente = pedidoPadrao.cliente, itens = pedidoPadrao.itens) {
    return postPedido(token, { cliente, itens });
  }

  describe("POST /api/pedidos", () => {
    it("CT-ORD-001: deve criar pedido valido com cliente, itens e total calculado", async () => {
      const resposta = await criarPedido("Maria Oliveira", [
        { nome: "Pizza Calabresa", quantidade: 1 },
        { nome: "Refrigerante", quantidade: 2 },
      ]);

      expect(resposta.status).to.equal(201);
      expect(resposta.body).to.have.property("id").that.is.a("number");
      expect(resposta.body).to.have.property("cliente", "Maria Oliveira");
      expect(resposta.body).to.have.property("itens").that.is.an("array");
      expect(resposta.body.itens[0]).to.include({ nome: "Pizza Calabresa", quantidade: 1 });
      expect(resposta.body.itens[0]).to.have.property("precoUnitario").that.is.a("number");
      expect(resposta.body).to.have.property("total").that.is.a("number").greaterThan(0);
      expect(resposta.body).to.have.property("status", "recebido");
      expect(resposta.body).to.have.property("criadoEm").that.is.a("string");
    });

    it("CT-ORD-002: deve retornar 400 quando cliente estiver ausente", async () => {
      const resposta = await request(app)
        .post("/api/pedidos")
        .set(authHeader(token))
        .send({ itens: [{ nome: "Pizza Calabresa", quantidade: 1 }] });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Campo cliente e obrigatorio.");
    });

    it("CT-ORD-003: deve retornar 400 quando itens estiver ausente", async () => {
      const resposta = await request(app)
        .post("/api/pedidos")
        .set(authHeader(token))
        .send({ cliente: "Maria Oliveira" });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Campo itens e obrigatorio e deve ser um array.");
    });

    it("CT-ORD-004: deve retornar 400 quando itens for array vazio", async () => {
      const resposta = await criarPedido("Maria Oliveira", []);

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("O pedido deve ter pelo menos 1 item.");
    });

    it("CT-ORD-005: deve retornar 400 quando quantidade do item for zero", async () => {
      const resposta = await criarPedido("Maria Oliveira", [{ nome: "Pizza Calabresa", quantidade: 0 }]);

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Cada item deve ter quantidade maior que zero.");
    });

    it("CT-ORD-006: deve ignorar preco enviado no payload e usar valor do cardapio", async () => {
      const resposta = await request(app)
        .post("/api/pedidos")
        .set(authHeader(token))
        .send({
          cliente: "Maria Oliveira",
          itens: [{ nome: "Pizza Calabresa", quantidade: 1, preco: 1 }],
        });

      expect(resposta.status).to.equal(201);
      expect(resposta.body.itens[0]).to.have.property("precoUnitario").that.is.a("number").and.equal(45);
      expect(resposta.body).to.have.property("total", 45);
    });

    it("CT-ORD-007: deve retornar 400 quando nao enviar body na criacao de pedido", async () => {
      const resposta = await request(app)
        .post("/api/pedidos")
        .set(authHeader(token));

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Body não enviado.");
    });
  });

  describe("GET /api/pedidos", () => {
    it("CT-ORD-008: deve listar pedidos como array", async () => {
      await criarPedido();

      const resposta = await request(app)
        .get("/api/pedidos")
        .set(authHeader(token));

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.be.an("array");
      expect(resposta.body[0]).to.include.all.keys(["id", "cliente", "itens", "total", "status", "criadoEm"]);
    });

    it("CT-ORD-009: deve retornar 401 quando nao enviar Authorization", async () => {
      const resposta = await request(app).get("/api/pedidos");

      expect(resposta.status).to.equal(401);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Token nao informado.");
    });

    it("CT-ORD-010: deve retornar array vazio quando nao houver pedidos", async () => {
      const resposta = await request(app)
        .get("/api/pedidos")
        .set(authHeader(token));

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.be.an("array").that.is.empty;
    });
  });

  describe("GET /api/pedidos/:id", () => {
    it("CT-ORD-011: deve retornar pedido existente por ID", async () => {
      const pedidoCriado = await criarPedido();

      const resposta = await request(app)
        .get(`/api/pedidos/${pedidoCriado.body.id}`)
        .set(authHeader(token));

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.include({ id: pedidoCriado.body.id, cliente: "Maria Oliveira", status: "recebido" });
      expect(resposta.body.itens).to.be.an("array");
    });

    it("CT-ORD-012: deve retornar 404 para ID inexistente", async () => {
      const resposta = await request(app)
        .get("/api/pedidos/9999")
        .set(authHeader(token));

      expect(resposta.status).to.equal(404);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Pedido nao encontrado.");
    });

    it("CT-ORD-013: deve retornar 400 para ID invalido", async () => {
      const resposta = await request(app)
        .get("/api/pedidos/abc")
        .set(authHeader(token));

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("ID do pedido invalido.");
    });
  });

  describe("PUT /api/pedidos/:id", () => {
    it("CT-ORD-014: deve atualizar pedido valido antes da entrega e recalcular total", async () => {
      const pedidoCriado = await criarPedido();

      const resposta = await request(app)
        .put(`/api/pedidos/${pedidoCriado.body.id}`)
        .set(authHeader(token))
        .send({
          cliente: "Maria Atualizada",
          itens: [
            { nome: "Pizza Mussarela", quantidade: 2 },
            { nome: "Refrigerante", quantidade: 1 },
          ],
        });

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.include({ cliente: "Maria Atualizada" });
      expect(resposta.body.itens).to.be.an("array");
      expect(resposta.body.total).to.equal(88);
    });

    it("CT-ORD-015: deve retornar 400 ao editar pedido em preparando", async () => {
      const pedido = await criarPedido();

      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });

      const resposta = await request(app)
        .put(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token))
        .send({ cliente: "Nao Pode", itens: [{ nome: "Pizza Calabresa", quantidade: 1 }] });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Pedido só pode ser alterado quando estiver com status 'recebido'.");
    });

    it("CT-ORD-016: deve retornar 400 ao editar pedido em pronto", async () => {
      const pedido = await criarPedido();

      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });

      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "pronto" });

      const resposta = await request(app)
        .put(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token))
        .send({ cliente: "Nao Pode", itens: [{ nome: "Pizza Calabresa", quantidade: 1 }] });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Pedido só pode ser alterado quando estiver com status 'recebido'.");
    });

    it("CT-ORD-017: deve retornar 400 ao editar pedido entregue", async () => {
      const pedido = await criarPedido();

      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });

      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "pronto" });

      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "entregue" });

      const resposta = await request(app)
        .put(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token))
        .send({ cliente: "Nao Pode", itens: [{ nome: "Pizza Calabresa", quantidade: 1 }] });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Pedido só pode ser alterado quando estiver com status 'recebido'.");
    });

    it("CT-ORD-018: deve retornar 400 com regra de status antes de validar payload invalido", async () => {
      const pedido = await criarPedido();

      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });

      const resposta = await request(app)
        .put(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token))
        .send({ cliente: "", itens: [] });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Pedido só pode ser alterado quando estiver com status 'recebido'.");
    });

    it("CT-ORD-019: deve retornar 400 quando cliente estiver ausente", async () => {
      const pedido = await criarPedido();

      const resposta = await request(app)
        .put(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token))
        .send({ itens: [{ nome: "Pizza Calabresa", quantidade: 1 }] });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Campo cliente e obrigatorio.");
    });

    it("CT-ORD-020: deve retornar 400 quando itens tiverem quantidade invalida", async () => {
      const pedido = await criarPedido();

      const resposta = await request(app)
        .put(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token))
        .send({ cliente: "Maria", itens: [{ nome: "Pizza Calabresa", quantidade: 0 }] });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Cada item deve ter quantidade maior que zero.");
    });

    it("CT-ORD-021: deve retornar 404 ao atualizar pedido inexistente", async () => {
      const resposta = await request(app)
        .put("/api/pedidos/9999")
        .set(authHeader(token))
        .send({ cliente: "Maria", itens: [{ nome: "Pizza Calabresa", quantidade: 1 }] });

      expect(resposta.status).to.equal(404);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Pedido nao encontrado.");
    });
  });

  describe("PATCH /api/pedidos/:id/status", () => {
    it("CT-ORD-022: deve atualizar status de recebido para preparando", async () => {
      const pedido = await criarPedido();

      const resposta = await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.have.property("status", "preparando");
    });

    it("CT-ORD-023: deve atualizar status de preparando para pronto", async () => {
      const pedido = await criarPedido();
      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });

      const resposta = await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "pronto" });

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.have.property("status", "pronto");
    });

    it("CT-ORD-024: deve atualizar status de pronto para entregue", async () => {
      const pedido = await criarPedido();
      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });
      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "pronto" });

      const resposta = await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "entregue" });

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.have.property("status", "entregue");
    });

    it("CT-ORD-025: deve retornar 400 para transicao de status invalida", async () => {
      const pedido = await criarPedido();

      const resposta = await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "pronto" });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Transicao de status invalida. Siga a ordem: recebido -> preparando -> pronto -> entregue.");
    });

    it("CT-ORD-026: deve retornar 400 para status nao reconhecido", async () => {
      const pedido = await criarPedido();

      const resposta = await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "finalizado" });

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Status informado e invalido.");
    });
  });

  describe("DELETE /api/pedidos/:id", () => {
    it("CT-ORD-027: deve excluir pedido com status recebido", async () => {
      const pedido = await criarPedido();

      const respostaDelete = await request(app)
        .delete(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token));

      expect(respostaDelete.status).to.equal(204);
      expect(respostaDelete.body).to.be.empty;

      const respostaBusca = await request(app)
        .get(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token));

      expect(respostaBusca.status).to.equal(200);
    expect(respostaBusca.body.status).to.equal("cancelado");
    });

    it("CT-ORD-028: deve retornar 400 ao excluir pedido em preparando", async () => {
      const pedido = await criarPedido();
      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });

      const resposta = await request(app)
        .delete(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token));

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Somente pedidos com status 'recebido' podem ser excluidos.");
    });

    it("CT-ORD-029: deve retornar 400 ao excluir pedido em entregue", async () => {
      const pedido = await criarPedido();
      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "preparando" });
      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "pronto" });
      await request(app)
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set(authHeader(token))
        .send({ status: "entregue" });

      const resposta = await request(app)
        .delete(`/api/pedidos/${pedido.body.id}`)
        .set(authHeader(token));

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Somente pedidos com status 'recebido' podem ser excluidos.");
    });

    it("CT-ORD-030: deve retornar 404 ao excluir pedido inexistente", async () => {
      const resposta = await request(app)
        .delete("/api/pedidos/9999")
        .set(authHeader(token));

      expect(resposta.status).to.equal(404);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("Pedido nao encontrado.");
    });

    it("CT-ORD-031: deve retornar 400 ao excluir com ID invalido", async () => {
      const resposta = await request(app)
        .delete("/api/pedidos/abc")
        .set(authHeader(token));

      expect(resposta.status).to.equal(400);
      expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
      expect(resposta.body.erro).to.equal("ID do pedido invalido.");
    });
  });
});
