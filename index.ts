import * as express from "express"

const app = express();

app.get("/tournaments", async (req, res) => {
    res.send("I'm test!");
});

app.listen(3000);
