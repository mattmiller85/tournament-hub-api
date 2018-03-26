import * as express from "express"
import * as uuid from "uuid";

import authController from "./controllers/AuthController";
import tournamentController from "./controllers/TournamentController";
import RedisTournamentHubRepo from "./RedisTournamentHubRepo";
const app = express();

// orchestrate dependencies here:
const repo = new RedisTournamentHubRepo(uuid.v4)

app.use("/auth", authController(repo));
app.use("/tournament", tournamentController(repo));

app.listen(3000);
