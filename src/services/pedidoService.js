const cardapio = require("../data/cardapio");
const pedidos = require("../data/pedidos");
const fluxoStatus = require("../data/statusPedido");
const Pedido = require("../models/Pedido");
const Counter = require("../models/Counter");
const { isDatabaseEnabled } = require("../config/database");

let proximoId = 1;

async function obterProximoId(nomeSequencia) {
  const resultado = await Counter.findByIdAndUpdate(
    nomeSequencia,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return resultado.seq;
}

function formatarPedido(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    cliente: obj.cliente,
    itens: obj.itens.map((item) => ({
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      subtotal: item.subtotal,
    })),
    total: obj.total,
    status: obj.status,
    criadoEm: obj.criadoEm ? obj.criadoEm.toISOString() : (obj.createdAt ? obj.createdAt.toISOString() : null),
    atualizadoEm: obj.atualizadoEm ? obj.atualizadoEm.toISOString() : (obj.updatedAt ? obj.updatedAt.toISOString() : null),
  };
}

function validarDadosPedido(cliente, itens) {
  if (!cliente || typeof cliente !== "string" || !cliente.trim()) {
    return { valido: false, erro: "Campo cliente e obrigatorio." };
  }

  if (!Array.isArray(itens)) {
    return { valido: false, erro: "Campo itens e obrigatorio e deve ser um array." };
  }

  if (itens.length === 0) {
    return { valido: false, erro: "O pedido deve ter pelo menos 1 item." };
  }

  for (const item of itens) {
    if (!item.nome || typeof item.nome !== "string") {
      return { valido: false, erro: "Cada item deve ter um nome valido." };
    }

    if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      return { valido: false, erro: "Cada item deve ter quantidade maior que zero." };
    }

    const produto = cardapio.find((produtoCardapio) => produtoCardapio.nome === item.nome);
    if (!produto) {
      return { valido: false, erro: `Item '${item.nome}' nao existe no cardapio.` };
    }
  }

  return { valido: true };
}

function calcularItens(itens) {
  return itens.map((item) => {
    const produto = cardapio.find((produtoCardapio) => produtoCardapio.nome === item.nome);
    const subtotal = produto.preco * item.quantidade;

    return {
      nome: produto.nome,
      quantidade: item.quantidade,
      precoUnitario: produto.preco,
      subtotal,
    };
  });
}

async function criarPedido(cliente, itens) {
  const validacao = validarDadosPedido(cliente, itens);
  if (!validacao.valido) {
    return { sucesso: false, status: 400, erro: validacao.erro };
  }

  const itensCalculados = calcularItens(itens);
  const total = itensCalculados.reduce((acumulador, item) => acumulador + item.subtotal, 0);

  if (isDatabaseEnabled()) {
    const novoId = await obterProximoId("pedidoId");
    const novoPedido = await Pedido.create({
      _id: novoId,
      cliente: cliente.trim(),
      itens: itensCalculados,
      total,
      status: "recebido",
      criadoEm: new Date(),
    });
    return { sucesso: true, pedido: formatarPedido(novoPedido) };
  } else {
    const novoId = proximoId;
    proximoId += 1;

    const pedido = {
      id: novoId,
      cliente: cliente.trim(),
      itens: itensCalculados,
      total,
      status: "recebido",
      criadoEm: new Date().toISOString(),
    };

    pedidos.push(pedido);

    return { sucesso: true, pedido };
  }
}

async function buscarPedidoPorId(id) {
  if (isDatabaseEnabled()) {
    const pedido = await Pedido.findById(id);
    return formatarPedido(pedido);
  }
  return pedidos.find((pedido) => pedido.id === id);
}

async function listarPedidos() {
  if (isDatabaseEnabled()) {
    const lista = await Pedido.find({});
    return lista.map(formatarPedido);
  }
  return pedidos;
}

async function atualizarPedido(id, cliente, itens) {
  if (isDatabaseEnabled()) {
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
    }

    if (pedido.status !== "recebido") {
      return {
        sucesso: false,
        status: 400,
        erro: "Pedido só pode ser alterado quando estiver com status 'recebido'.",
      };
    }

    const validacao = validarDadosPedido(cliente, itens);
    if (!validacao.valido) {
      return { sucesso: false, status: 400, erro: validacao.erro };
    }

    const itensCalculados = calcularItens(itens);
    const total = itensCalculados.reduce((acumulador, item) => acumulador + item.subtotal, 0);

    pedido.cliente = cliente.trim();
    pedido.itens = itensCalculados;
    pedido.total = total;
    pedido.atualizadoEm = new Date();
    await pedido.save();

    return { sucesso: true, pedido: formatarPedido(pedido) };
  } else {
    const pedido = buscarPedidoPorId(id);
    if (!pedido) {
      return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
    }

    if (pedido.status !== "recebido") {
      return {
        sucesso: false,
        status: 400,
        erro: "Pedido só pode ser alterado quando estiver com status 'recebido'.",
      };
    }

    const validacao = validarDadosPedido(cliente, itens);
    if (!validacao.valido) {
      return { sucesso: false, status: 400, erro: validacao.erro };
    }

    const itensCalculados = calcularItens(itens);
    const total = itensCalculados.reduce((acumulador, item) => acumulador + item.subtotal, 0);

    pedido.cliente = cliente.trim();
    pedido.itens = itensCalculados;
    pedido.total = total;
    pedido.atualizadoEm = new Date().toISOString();

    return { sucesso: true, pedido };
  }
}

async function excluirPedido(id) {
  if (isDatabaseEnabled()) {
    const pedido = await Pedido.findById(id);

    if (!pedido) {
      return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
    }

    if (pedido.status !== "recebido") {
      return {
        sucesso: false,
        status: 400,
        erro: "Somente pedidos com status 'recebido' podem ser excluidos.",
      };
    }

    pedido.status = "cancelado";
    pedido.atualizadoEm = new Date();
    await pedido.save();
    return { sucesso: true, pedido: formatarPedido(pedido) };
  } else {
    const pedido = buscarPedidoPorId(id);

    if (!pedido) {
      return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
    }

    if (pedido.status !== "recebido") {
      return {
        sucesso: false,
        status: 400,
        erro: "Somente pedidos com status 'recebido' podem ser excluidos.",
      };
    }

    pedido.status = "cancelado";
    pedido.atualizadoEm = new Date().toISOString();
    return { sucesso: true, pedido };
  }
}

async function atualizarStatusPedido(id, novoStatus) {
  if (!novoStatus || typeof novoStatus !== "string") {
    return { sucesso: false, status: 400, erro: "Campo status e obrigatorio." };
  }

  if (isDatabaseEnabled()) {
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
    }

    if (!fluxoStatus.includes(novoStatus)) {
      return { sucesso: false, status: 400, erro: "Status informado e invalido." };
    }

    const indiceAtual = fluxoStatus.indexOf(pedido.status);
    const indiceNovo = fluxoStatus.indexOf(novoStatus);

    if (pedido.status === "entregue") {
      return { sucesso: false, status: 400, erro: "Pedido ja foi entregue e nao pode ser alterado." };
    }

    if (indiceNovo !== indiceAtual + 1) {
      return {
        sucesso: false,
        status: 400,
        erro: "Transicao de status invalida. Siga a ordem: recebido -> preparando -> pronto -> entregue.",
      };
    }

    pedido.status = novoStatus;
    pedido.atualizadoEm = new Date();
    await pedido.save();

    return { sucesso: true, pedido: formatarPedido(pedido) };
  } else {
    const pedido = buscarPedidoPorId(id);
    if (!pedido) {
      return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
    }

    if (!fluxoStatus.includes(novoStatus)) {
      return { sucesso: false, status: 400, erro: "Status informado e invalido." };
    }

    const indiceAtual = fluxoStatus.indexOf(pedido.status);
    const indiceNovo = fluxoStatus.indexOf(novoStatus);

    if (pedido.status === "entregue") {
      return { sucesso: false, status: 400, erro: "Pedido ja foi entregue e nao pode ser alterado." };
    }

    if (indiceNovo !== indiceAtual + 1) {
      return {
        sucesso: false,
        status: 400,
        erro: "Transicao de status invalida. Siga a ordem: recebido -> preparando -> pronto -> entregue.",
      };
    }

    pedido.status = novoStatus;
    pedido.atualizadoEm = new Date().toISOString();

    return { sucesso: true, pedido };
  }
}

async function resetarDadosPedidos() {
  if (isDatabaseEnabled()) {
    try {
      await Pedido.collection.drop();
    } catch (e) {
      // ignore
    }
    try {
      await Counter.collection.drop();
    } catch (e) {
      // ignore
    }
  }
  pedidos.length = 0;
  proximoId = 1;
}

module.exports = {
  criarPedido,
  atualizarPedido,
  excluirPedido,
  atualizarStatusPedido,
  buscarPedidoPorId,
  listarPedidos,
  resetarDadosPedidos,
};
