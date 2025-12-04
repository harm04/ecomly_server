const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const env = process.env;

app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
// app.options("/*", cors());

mongoose
  .connect(env.MONGODB_CONNECTION_STRING)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const hostname = env.hostname;
const port = env.port;
app.listen(port, hostname, () => {
  console.log(`Server started at http://${hostname}:${port}`);
});

app.get("/watch/:id", (request, response) => {
  return response.json({ videoId: request.params.id });
});
