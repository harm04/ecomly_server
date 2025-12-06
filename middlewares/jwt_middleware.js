const { expressjwt: expjwt } = require("express-jwt");
const { Token } = require("../models/token_schema");

function authJwt() {
  const API = process.env.API_URL;
  return expjwt({
    secret: process.env.ACESS_TOKEN_SECRET,
    algorithms: ["HS256"],
    isRevoked: isRevoked,
  }).unless({
    path: [
      `${API}/login`,
      `${API}/login/`,
      `${API}/register`,
      `${API}/register/`,
      `${API}/forget-password`,
      `${API}/forget-password/`,
      `${API}/reset-password`,
      `${API}/reset-password/`,
    ],
  });
}

async function isRevoked(req, jwt) {
  const authHeader = req.header("Authorization");
  if (!authHeader.startsWith("Bearer ")) {
    return true;
  }
  const accessToken = authHeader.replace("Bearer", "").trim();
  const token = await Token.findOne({ accessToken });
  const adminRoutRegex = /^\/api\/v1\/admin\//i;
  const adminFault =
    !jwt.payload.isAdmin && adminRoutRegex.test(req.originalUrl);
  return adminFault || !token;
}

module.exports = authJwt;
