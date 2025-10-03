const express = require("express");
const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());

// Start the app server
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
