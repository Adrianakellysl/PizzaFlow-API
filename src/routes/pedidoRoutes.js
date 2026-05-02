const express = require("express");
const pedidoController = require("../controllers/pedidoController");
const validarToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(validarToken);

router.post("/pedidos", pedidoController.criarPedido);
router.put("/pedidos/:id", pedidoController.atualizarPedido);
router.delete("/pedidos/:id", pedidoController.excluirPedido);
router.patch("/pedidos/:id/status", pedidoController.atualizarStatus);
router.get("/pedidos/:id", pedidoController.buscarPedido);
router.get("/pedidos", pedidoController.listarPedidos);

module.exports = router;
