// simple health check returning the wallet address requested
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    status: "ok",
    wallet: "THHGMsjy5RwECeWeyE6cFR8WkGRzDEcjve"
  }));
};
