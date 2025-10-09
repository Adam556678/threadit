const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const connectDB = require("./server/config/db.js");

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

require("dotenv").config();
const PORT = 3000;
connectDB();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Threadit API",
      version: "1.0.0",
      description: "A Reddit clone API",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./server/routes/*.js"], 
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());    

// Routes
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.use("/users", require("./server/routes/user.js"));
app.use("/communities", require("./server/routes/community.js"));
app.use("/posts", require("./server/routes/post.js"));
app.use("/votes", require("./server/routes/vote.js"));

// Start the app server
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
