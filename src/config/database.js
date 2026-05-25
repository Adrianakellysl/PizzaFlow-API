const mongoose = require("mongoose");

function getMongoUri() {
  return process.env.MONGODB_URI;
}

function isDatabaseConfigured() {
  return Boolean(getMongoUri());
}

function isDatabaseEnabled() {
  return isDatabaseConfigured() && mongoose.connection.readyState === 1;
}

async function connectDatabase() {
  if (!isDatabaseConfigured()) {
    console.log("MongoDB desativado. Usando armazenamento em memoria.");
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(getMongoUri());
  console.log("MongoDB conectado.");
}

module.exports = {
  connectDatabase,
  isDatabaseConfigured,
  isDatabaseEnabled,
};
