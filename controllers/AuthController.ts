import * as bodyParser from "body-parser";
import * as express from "express";
import * as jwt from "jsonwebtoken";
import config from "../config";
import { ITournamentHubRepo } from "../ITournamentHubRepo";
import User from "../models/User";
import verifyToken from "./VerifyToken";

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

export default (repo: ITournamentHubRepo) => {

    router.post("/register", async (req, res) => {
        const user = await repo.register({
            email: req.body.email,
            id: "",
            isConfirmed: false,
            name: req.body.name,
            roles: [],
        }, req.body.password);
        if (!user) {
            res.status(500).send("There was a problem registering the user.");
            return;
        }
        const confirmUrl = `${config.confirmUrlBase}${user.id}`;
        res.status(200).send({ auth: true, confirmUrl });
    });

    router.post("/login", async (req, res) => {
        const user = await repo.login(req.body.email, req.body.password);
        if (user) {
            const token = jwt.sign({ id: user.id }, config.jwtSecret, {
                expiresIn: config.tokenExpiresSeconds, // expires in 24 hours
            });
            res.status(200).send({ auth: true, token });
        } else {
            res.status(500).send("There was a problem registering the user.");
        }
    });

    router.get("/confirm/:userId", async (req, res) => {
        const userId = req.params.userId;
        const user = await repo.findUserById(userId);
        user.isConfirmed = true;
        const success = await repo.saveUser(user);
        if (success) {
            res.status(200).send({ confirmed: true, loginUrl: config.loginUrl });
        } else {
            res.status(500).send({ confirmed: false });
        }
    });

    router.get("/me", verifyToken, async (req, res) => {
        // req.params.userId should get set in verifyToken if we're good to go
        // otherwise, we'll never get here
        const user = await repo.findUserById(req.params.userId);
        res.status(200).send(user);
    });

    return router;
};
