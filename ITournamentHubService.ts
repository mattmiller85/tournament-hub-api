import User from "./models/User";
import Tournament from "./models/Tournament";
import Game from "./models/Game";

export interface LoginResponse {
    auth: boolean;
    token: string;
    user: User;
    message?: string
}

export interface ITournamentHubService {
    envTest(): Promise<string>;

    // auth
    registerUser(userInfo: { email: string, name: string, password: string, confirmUrlBase: string}): Promise<{ status: number, response: any }>;
    login(userInfo: { email: string, password: string}): Promise<{ status: number, response: LoginResponse }>;
    confirm(userId: string): Promise<{ status: number, response: { confirmed: boolean } }>;
    getUserById(userId: string): Promise<{ status: number, response: User }>;

    // tournament
    getTournamentsForUser(userId: string): Promise<{ status: number, response: Tournament[] }>;
    getTournamentById(tournamentId: string): Promise<{ status: number, response: Tournament }>;
    addTournamentToUser(tournamentId: string, userId: string): Promise<{ status: number, response: boolean, }>;
    removeTournamentForUser(tournamentId: string, userId: string): Promise<{ status: number; response: boolean; }>

    addTournament(t: Tournament, userId: string, eventId: string): Promise<{ status: number, response: Tournament }>
    updateTournament(t: Tournament, tournamentId: string, userId: string, eventId: string): Promise<{ status: number, response: Tournament }>
    addGame(game: Game, tournamentId: string, userId: string, eventId: string): Promise<{ status: number; response: Tournament; }>
    updateGame(game: Game, tournamentId: string, userId: string, eventId: string): Promise<{ status: number; response: Tournament; }>
}