import * as bodyParser from "body-parser";
import * as express from "express";
import * as jwt from "jsonwebtoken";
import * as nodemailer from "nodemailer";
import config from "../config";
import User from "../models/User";
import verifyToken from "./VerifyToken";
import { ITournamentHubService } from "../ITournamentHubService";
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

export default (service: ITournamentHubService) => {

    router.post("/register", async (req, res) => {
        const { response, status } = await service.registerUser({
            email: req.body.email,
            name: req.body.name,
            password: req.body.password,
            confirmUrlBase: req.body.confirmUrlBase
        })
        res.status(status).send(response);
    });

    router.post("/login", async (req, res) => {
        const { response, status } = await service.login({
            email: req.body.email,
            password: req.body.password
        })
        res.status(status).send(response);
    });

    router.get("/confirm/:userId", async (req, res) => {
        const { response, status } = await service.confirm(req.params.userId)
        res.status(status).send(response);
    });

    router.get("/me", verifyToken, async (req, res) => {
        // req.params.userId should get set in verifyToken if we're good to go
        // otherwise, we'll never get here
        const { response, status } = await service.getUserById(req.params.userId)
        res.status(status).send(response);
    });

    return router;
};
