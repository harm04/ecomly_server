const { default: mongoose } = require("mongoose");

const jwt = require("jsonwebtoken");

async function authorizePostRequest(req, res, next) {
  const message =
    "User conflict. The user making the request does not match the token user.";
  if (req.method !== "POST") return next();
  const API = process.env.API_URL;
  if (req.originalUrl.startsWith(`${API}/admin`)) return next();
  const endpoints = [
    `${API}/login`,

    `${API}/register`,

    `${API}/forget-password`,

    `${API}/reset-password`,
  ];
  const isMatchingEndpoint = endpoints.some((endpoint) =>
    req.originalUrl.includes(endpoint)
  );
  if (isMatchingEndpoint) return next();
  const authHeader = req.header("Authorization");
  if (!authHeader) return next();
  const accessToken = authHeader.replace("Bearer", "").trim();
  const tokenData = jwt.decode(accessToken);
  if (req.body.user && tokenData.id !== req.body.user) {
    return res.status(401).json({
      message,
    });
  } else if (/\/users\/([^/]+)\//.test(req.originalUrl)) {
    const parts = req.originalUrl.split("/");
    const usersIndex = parts.indexOf("users");
    const id = parts[usersIndex + 1];
    if (!mongoose.isValidObjectId(id)) return next();
    if (tokenData.id !== id) return res.status(401).json({ message });
  }
  return next();
}

module.exports = authorizePostRequest;
