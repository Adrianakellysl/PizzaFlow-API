const express = require("express");
const authRoutes = require("./authRoutes");
const pedidoRoutes = require("./pedidoRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(pedidoRoutes);

module.exports = router;
