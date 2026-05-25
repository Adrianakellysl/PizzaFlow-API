const pedidoService = require("../services/pedidoService");
const { validarBody, validarPedidoId } = require("../helpers/validators");

async function criarPedido(req, res) {
  if (!validarBody(req, res)) {
    return;
  }

  const { cliente, itens } = req.body;
  const resultado = await pedidoService.criarPedido(cliente, itens);

  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(201).json(resultado.pedido);
}

async function atualizarStatus(req, res) {
  if (!validarBody(req, res)) {
    return;
  }

  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const { status } = req.body;
  const resultado = await pedidoService.atualizarStatusPedido(pedidoId, status);

  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(200).json(resultado.pedido);
}

async function buscarPedido(req, res) {
  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const pedido = await pedidoService.buscarPedidoPorId(pedidoId);
  if (!pedido) {
    return res.status(404).json({ erro: "Pedido nao encontrado." });
  }

  return res.status(200).json(pedido);
}

async function listarPedidos(req, res) {
  const lista = await pedidoService.listarPedidos();
  return res.status(200).json(lista);
}

async function atualizarPedido(req, res) {
  if (!validarBody(req, res)) {
    return;
  }

  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const { cliente, itens } = req.body;
  const resultado = await pedidoService.atualizarPedido(pedidoId, cliente, itens);

  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(200).json(resultado.pedido);
}

async function excluirPedido(req, res) {
  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const resultado = await pedidoService.excluirPedido(pedidoId);
  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(204).send();
}

module.exports = {
  criarPedido,
  atualizarStatus,
  atualizarPedido,
  excluirPedido,
  buscarPedido,
  listarPedidos,
};
