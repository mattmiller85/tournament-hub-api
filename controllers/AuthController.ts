import * as bodyParser from "body-parser";
import * as express from "express";
import * as jwt from "jsonwebtoken";
import * as nodemailer from "nodemailer";
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
            res.status(500).send({ auth: false, message: "There was a problem registering the user." });
            return;
        }
        const confirmUrl = `${req.body.confirmUrlBase}${user.id}`;
        const smtpTransport = nodemailer.createTransport({
            auth: {
                pass: process.env.TH_CONFIRM_PASS,
                user: process.env.TH_CONFIRM_USER,
            },
            service: "Gmail",
        });
        const mailOptions = {
            from: "Tournament Hub <tournament-hub@gmail.com>",
            to: user.email,
            // tslint:disable-next-line:object-literal-sort-keys
            subject: "Tournament Hub Account Confirmation",
            text: `Please click on the following link to confirm your account: ${confirmUrl}`,
            html: `<a href='${confirmUrl}'>Please click here to confirm your account</a>`,
        };
        smtpTransport.sendMail(mailOptions, (error, response) => {
            if (error) {
                res.status(500).send({ auth: false, message: "There was a problem sending the confirmation email to the user." });
                return;
            }
            smtpTransport.close();
            res.status(200).send({ auth: true });
        });
    });

    router.post("/login", async (req, res) => {
        const user = await repo.login(req.body.email, req.body.password);
        if (user) {
            const token = jwt.sign({ id: user.id }, config.jwtSecret, {
                expiresIn: config.tokenExpiresSeconds, // expires in 24 hours
            });
            res.status(200).send({ auth: true, token, user });
        } else {
            res.status(500).send({ auth: false, message: "There was a problem logging in the user." });
        }
    });

    router.get("/confirm/:userId", async (req, res) => {
        const userId = req.params.userId;
        const user = await repo.findUserById(userId);
        user.isConfirmed = true;
        const success = await repo.saveUser(user);
        if (success) {
            res.status(200).send({ confirmed: true });
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
