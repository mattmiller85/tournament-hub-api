import * as express from "express"
import * as uuid from "uuid";

import authController from "./controllers/AuthController";
import tournamentController from "./controllers/TournamentController";
import RedisTournamentHubRepo from "./RedisTournamentHubRepo";
const app = express();

// orchestrate dependencies here:
const repo = new RedisTournamentHubRepo(uuid.v4)

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, PUT, POST");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    next();
});

app.use("/auth", authController(repo));
app.use("/tournament", tournamentController(repo));

const port = 3009;
console.log(`Listening on port ${port}.`);
console.log(`Confirm email: ${process.env.TH_CONFIRM_USER}.`);
console.log(`Confirm pass: ${process.env.TH_CONFIRM_PASS ? "******" : "Not Set!"}.`);

app.listen(3009);
