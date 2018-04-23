import { ITournamentHubService, LoginResponse } from "./ITournamentHubService";
import { ITournamentHubRepo } from "./ITournamentHubRepo";
import * as jwt from "jsonwebtoken";
import * as nodemailer from "nodemailer";
import User from "./models/User";

import config from "./config";
import Tournament from "./models/Tournament";
import Game from "./models/Game";

interface ServiceResponse<TResponse> {
    status: number;
    response: TResponse;
}

export class TournamentHubService implements ITournamentHubService {

    constructor(private repo: ITournamentHubRepo) { }

    async envTest(): Promise<string> {
        return Promise.resolve(process.env.test_env_var);
    }

    async login(loginInfo: { email: string, password: string }):
        Promise<ServiceResponse<LoginResponse>> {

        const { repo } = this;
        const user = await repo.login(loginInfo.email, loginInfo.password);

        if (!user) {

            return Promise.resolve({
                status: 500, response: {
                    auth: false, token: null, user: null, message: "There was a problem logging in the user."
                }
            });
        }
        const token = jwt.sign({ id: user.id }, config.jwtSecret, {
            expiresIn: config.tokenExpiresSeconds, // expires in 24 hours
        });
        return Promise.resolve({ status: 200, response: { auth: true, token, user } });
    }

    async registerUser(userInfo: { email: string; name: string; password: string; confirmUrlBase: string; }):
        Promise<ServiceResponse<{ auth: boolean, message?: string }>> {

        const { repo } = this;
        const user = await repo.register({
            email: userInfo.email,
            id: "",
            isConfirmed: false,
            name: userInfo.name,
            roles: [],
        }, userInfo.password);
        if (!user) {
            return Promise.resolve({ status: 500, response: { auth: false, message: "There was a problem registering the user." } });
        }
        const confirmUrl = `${userInfo.confirmUrlBase}${user.id}`;
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
        return new Promise<ServiceResponse<{ auth: boolean, message?: string }>>((resolve, reject) => {
            smtpTransport.sendMail(mailOptions, (error, response) => {
                if (error) {
                    resolve({ status: 500, response: { auth: false, message: "There was a problem sending the confirmation email to the user." } });
                    return;
                }
                smtpTransport.close();
                resolve({ status: 500, response: { auth: true } });
            });
        });
    }

    async confirm(userId: string): Promise<{ status: number, response: { confirmed: boolean } }> {
        const { repo } = this;

        const user = await repo.findUserById(userId);
        user.isConfirmed = true;
        const success = await repo.saveUser(user);
        if (success) {
            return Promise.resolve({ status: 200, response: { confirmed: true }});
        } else {
            return Promise.resolve({ status: 500, response: { confirmed: false }});
        }
    }

    async getUserById(userId: string): Promise<{ status: number, response: User }> {
        const { repo } = this;
        const user = await repo.findUserById(userId);
        return Promise.resolve({ status: 200, response: user });
    }






    async getTournamentsForUser(userId: string): Promise<{ status: number; response: Tournament[] }> {
        const { repo } = this;
        return { status: 200, response: await repo.getTournamentsForUser(userId) };
    }
    async getTournamentById(tournamentId: string): Promise<{ status: number; response: Tournament; }> {
        const { repo } = this;
        return { status: 200, response: await repo.getTournamentById(tournamentId) };
    }

    async addTournamentToUser(tournamentId: string, userId: string): Promise<{ status: number; response: boolean; }> {
        const { repo } = this;
        return { status: 200, response: await repo.addTournamentToUser(tournamentId, userId) };
    }

    async removeTournamentForUser(tournamentId: string, userId: string): Promise<{ status: number; response: boolean; }> {
        const { repo } = this;
        return { status: 200, response: await repo.removeTournamentForUser(tournamentId, userId) };
    }

    async addTournament(t: Tournament, userId: string, eventId: string): Promise<{ status: number; response: Tournament; }> {
        const { repo } = this;
        t.id = null;
        const savedTournament = await repo.saveTournament(t, userId, eventId);
        return Promise.resolve({ status: 200, response: savedTournament });
    }

    async updateTournament(t: Tournament, tournamentId: string, userId: string, eventId: string): Promise<{ status: number; response: Tournament; }> {
        const { repo } = this;
        t.id = tournamentId;
        const savedTournament = await repo.saveTournament(t, userId, eventId);
        return Promise.resolve({ status: 200, response: savedTournament });
    }

    async addGame(game: Game, tournamentId: string, userId: string, eventId: string): Promise<{ status: number; response: Tournament; }> {
        const { repo } = this;
        game.id = repo.idGenerator();
        const t = await repo.getTournamentById(tournamentId);
        t.games.push(game);
        const savedTournament = await repo.saveTournament(t, userId, eventId);
        return Promise.resolve({ status: 200, response: savedTournament });
    }

    async updateGame(game: Game, tournamentId: string, userId: string, eventId: string): Promise<{ status: number; response: Tournament; }> {
        const { repo } = this;
        const t = await repo.getTournamentById(tournamentId);
        const currentGIndex = t.games.findIndex(cg => cg.id === game.id);
        t.games.splice(currentGIndex, 1, game);
        const savedTournament = await repo.saveTournament(t, userId, eventId);
        return Promise.resolve({ status: 200, response: savedTournament });
    }
}