import * as bodyParser from "body-parser";
import * as express from "express";
import config from "../config";
import { ITournamentHubRepo } from "../ITournamentHubRepo";
import verifyToken from "./VerifyToken";

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

export default (repo: ITournamentHubRepo) => {

    // Gets all tournaments for this user.
    // This includes 1) any tournaments they created
    // 2) any tournaments of any event they created
    // 3) any tournament they subscribed to
    // 4) any tournament from any event they subscribed to
    router.get("/", verifyToken, async (req, res) => {
        const tournaments = await repo.getTournamentsForUser(req.params.userId);
        res.status(200).send({ tournaments });
    });

    router.get("/:tournamentId", verifyToken, async (req, res) => {
        const tournament = await repo.getTournamentById(req.params.tournamentId);
        res.status(200).send(tournament);
    });

    router.get("/:tournamentId/follow", verifyToken, async (req, res) => {
        const success = await repo.addTournamentToUser(req.params.tournamentId, req.params.userId);
        res.status(200).send(success);
    });

    router.get("/:tournamentId/unfollow", verifyToken, async (req, res) => {
        const success = await repo.removeTournamentForUser(req.params.tournamentId, req.params.userId);
        res.status(200).send(success);
    });

    return router;
};
