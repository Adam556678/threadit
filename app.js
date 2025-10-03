const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const connectDB = require("./server/config/db.js");

const PORT = 3000;

require("dotenv").config();
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use("/users", require("./server/routes/user.js"))

// Start the app server
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
