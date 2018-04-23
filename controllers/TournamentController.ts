import * as bodyParser from "body-parser";
import * as express from "express";
import config from "../config";
import verifyToken from "./VerifyToken";
import Tournament from "../models/Tournament";
import Game from "../models/Game";
import { ITournamentHubService } from "../ITournamentHubService";
import { ITournamentHubRepo } from "../ITournamentHubRepo";

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

export default (service: ITournamentHubService) => {

    // Gets all tournaments for this user.
    // This includes 1) any tournaments they created
    // 2) any tournaments of any event they created
    // 3) any tournament they subscribed to
    // 4) any tournament from any event they subscribed to
    router.get("/", verifyToken, async (req, res) => {
        const { status, response } = await service.getTournamentsForUser(req.params.userId);
        res.status(status).send({ tournaments: response });
    });

    router.get("/:tournamentId", verifyToken, async (req, res) => {
        const { status, response } = await service.getTournamentById(req.params.tournamentId);
        res.status(status).send(response);
    });

    router.get("/:tournamentId/follow", verifyToken, async (req, res) => {
        const { status, response } = await service.addTournamentToUser(req.params.tournamentId, req.params.userId);
        res.status(status).send(response);
    });

    router.get("/:tournamentId/unfollow", verifyToken, async (req, res) => {
        const { status, response } = await service.removeTournamentForUser(req.params.tournamentId, req.params.userId);
        res.status(status).send(response);
    });

    router.post("/", verifyToken, async (req, res) => {
        const t = req.body as Tournament;
        const { status, response } = await service.addTournament(t, req.params.userId, req.params.eventId);
        res.status(status).send(response);
    });

    router.put("/:tournamentId", verifyToken, async (req, res) => {
        const t = req.body as Tournament;
        const { status, response } = await service.updateTournament(t, req.params.tournamentId, req.params.userId, req.params.eventId);
        res.status(status).send(response);
    });

    router.post("/:tournamentId/game/add", verifyToken, async (req, res) => {
        const g = req.body as Game;
        const { status, response } = await service.addGame(g, req.params.tournamentId, req.params.userId, req.params.eventId);
        res.status(status).send(response);
    });

    router.put("/:tournamentId/game/save", verifyToken, async (req, res) => {      
        const g = req.body as Game;
        const { status, response } = await service.updateGame(g, req.params.tournamentId, req.params.userId, req.params.eventId);
        res.status(status).send(response);
    });

    return router;
};
