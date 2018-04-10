import * as bodyParser from "body-parser";
import * as express from "express";
import config from "../config";
import { ITournamentHubRepo } from "../ITournamentHubRepo";
import verifyToken from "./VerifyToken";
import Tournament from "../models/Tournament";
import Game from "../models/Game";

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

    router.post("/", verifyToken, async (req, res) => {
        const t = req.body as Tournament;
        t.id = null
        const savedTournament = await repo.saveTournament(t, req.params.userId, req.params.eventId);
        res.status(200).send(savedTournament);
    });

    router.put("/:tournamentId", verifyToken, async (req, res) => {
        const t = req.body as Tournament;
        t.id = req.params.tournamentId;
        const savedTournament = await repo.saveTournament(t, req.params.userId, req.params.eventId);
        res.status(200).send(savedTournament);
    });

    router.post("/:tournamentId/game/add", verifyToken, async (req, res) => {
        const g = req.body as Game;
        g.id = repo.idGenerator();
        const t = await repo.getTournamentById(req.params.tournamentId);
        t.games.push(g);
        const savedTournament = await repo.saveTournament(t, req.params.userId, req.params.eventId);
        res.status(200).send(savedTournament);
    });

    router.put("/:tournamentId/game/save", verifyToken, async (req, res) => {
        const g = req.body as Game;
        const t = await repo.getTournamentById(req.params.tournamentId);
        const currentGIndex = t.games.findIndex(cg => cg.id === g.id);
        t.games.splice(currentGIndex, 1, g);
        const savedTournament = await repo.saveTournament(t, req.params.userId, req.params.eventId);
        res.status(200).send(savedTournament);
    });

    return router;
};
