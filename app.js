const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const authJwt = require("./middlewares/jwt_middleware");
const errorHandler = require("./middlewares/error_handler");
const authorizePostRequest = require("./middlewares/authorization");

const app = express();
const env = process.env;
const API = env.API_URL;

app.use(
  cors({
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(authorizePostRequest);
app.use(errorHandler);

const authRouter = require("./routes/auth_route");
const usersRouter = require("./routes/users_route");
const adminRouter = require("./routes/admin_routes");
const categoriesRouter = require("./routes/categories_routes");
const productsRouter = require("./routes/products_routes");
const checkoutRouter = require("./routes/checkout_routes");
const ordersRouter = require("./routes/orders_routes");

app.use(`${API}/`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/admin`, adminRouter);
app.use(`${API}/categories`, categoriesRouter);
app.use(`${API}/products`, productsRouter);
app.use(`${API}/checkout`, checkoutRouter);
app.use(`${API}/orders`, ordersRouter);
app.use("/public", express.static(__dirname + "/public"));
require("./helpers/cron_jobs");

mongoose
  .connect(env.MONGODB_CONNECTION_STRING)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const hostname = env.HOST;
const port = env.port;
app.listen(port, hostname, () => {
  console.log(`Server started at http://${hostname}:${port}`);
});
