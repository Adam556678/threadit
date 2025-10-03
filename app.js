const express = require("express");
const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/users", require("./server/routes/user.js"))

// Start the app server
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
