import * as bcrypt from "bcryptjs"
import { RedisClient } from "redis";
import { promisify } from "util";

import cfg from "./config";
import { ITournamentHubRepo } from "./ITournamentHubRepo";
import Event from "./models/Event";
import Tournament from "./models/Tournament";
import User from "./models/User";

export default class RedisTournamentHubRepo implements ITournamentHubRepo {

    private hgetAsync: (key: string, hashKey: string) => Promise<string>;
    private getAsync: (key: string) => Promise<string>;
    private smembersAsync: (key: string) => Promise<string[]>;
    private client: RedisClient;

    constructor(public idGenerator: () => string) {
        this.client = new RedisClient({
            db: cfg.redis.dbIndex,
        })
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.hgetAsync = promisify(this.client.hget).bind(this.client);
        this.smembersAsync = promisify(this.client.smembers).bind(this.client);
    }
    public async findUserByEmail(email: string): Promise<User> {
        const userId = await this.hgetAsync(`${cfg.redis.prefixUser}by_email`, email)
        const user = await this.findUserById(userId);
        return Promise.resolve(user);
    }
    public async findUserById(userId: string): Promise<User> {
        const user = await this.getAsync(`${cfg.redis.prefixUser}${userId}`);
        return Promise.resolve(JSON.parse(user) as User);
    }
    public async saveUser(user: User): Promise<boolean> {
        this.client.hset(`${cfg.redis.prefixUser}by_email`, user.email, user.id);
        return Promise.resolve(this.client.set(`${cfg.redis.prefixUser}${user.id}`, JSON.stringify(user)));
    }
    public async removeUser(userId: string): Promise<boolean> {
        const user = await this.findUserById(userId);
        if (!user) {
            return Promise.resolve(true);
        }
        await this.client.del(`${cfg.redis.prefixEvents}by_user:${userId}`);
        await this.client.del(`${cfg.redis.prefixTournaments}by_user:${userId}`);
        return Promise.resolve(this.client.del(`${cfg.redis.prefixUser}${user.id}`));
    }
    public async login(email: string, password: string): Promise<User> {
        const user = await this.findUserByEmail(email);
        if (!user || !user.isConfirmed) {
            return Promise.resolve(null);
        }
        const actualHashedPwd = (await this.getAsync(`${cfg.redis.prefixUser}password:${user.id}`));
        if (bcrypt.compareSync(password, actualHashedPwd)) {
            return Promise.resolve(user);
        }
        return Promise.resolve(null);
    }
    public async register(user: User, password: string): Promise<User> {
        const existingUser = await this.findUserByEmail(user.email);
        if (existingUser) {
            return Promise.resolve(null);
        }
        user.id = this.idGenerator();
        password = await bcrypt.hash(password, 8);
        await this.saveUser(user)
        this.client.set(`${cfg.redis.prefixUser}password:${user.id}`, password);
        return Promise.resolve(user);
    }



    public async getEventById(eventId: string): Promise<Event> {
        const eventString = await this.getAsync(`${cfg.redis.prefixEvent}${eventId}`);
        return Promise.resolve(JSON.parse(eventString) as Event);
    }
    public async getEventsForUser(userId: string): Promise<Event[]> {
        const eventIds = await this.smembersAsync(`${cfg.redis.prefixEvents}by_user:${userId}`);
        const events = await Promise.all(eventIds.map((id) => this.getEventById(id)));
        return Promise.resolve(events);
    }
    public async saveEvent(event: Event, userId: string): Promise<Event> {
        event.id = event.id || this.idGenerator();
        await this.client.sadd(`${cfg.redis.prefixEvents}by_user:${userId}`, event.id);
        await this.client.set(`${cfg.redis.prefixEvent}${event.id}`, JSON.stringify(event));
        return Promise.resolve(event);
    }



    public async getTournamentById(tournamentId: string): Promise<Tournament> {
        const tournamentString = await this.getAsync(`${cfg.redis.prefixTournament}${tournamentId}`);
        return Promise.resolve(JSON.parse(tournamentString) as Tournament);
    }
    public async getTournamentsForEvent(eventId: string): Promise<Tournament[]> {
        const tournamentIds = await this.smembersAsync(`${cfg.redis.prefixTournaments}by_event:${eventId}`)
        const tournaments = await Promise.all(tournamentIds.map((id) => this.getTournamentById(id)));
        return Promise.resolve(tournaments);
    }
    public async getTournamentsForUser(userId: string): Promise<Tournament[]> {
        const tournamentIds = await this.smembersAsync(`${cfg.redis.prefixTournaments}by_user:${userId}`)
        const tournaments = await Promise.all(tournamentIds.map((id) => this.getTournamentById(id)));
        return Promise.resolve(tournaments);
    }
    public async addTournamentToEvent(tournamentId: string, eventId: string): Promise<boolean> {
        const success = await this.client.sadd(`${cfg.redis.prefixTournaments}by_event:${eventId}`, tournamentId);
        return Promise.resolve(success);
    }
    public async addTournamentToUser(tournamentId: string, userId: string): Promise<boolean> {
        const t = await this.getTournamentById(tournamentId);
        if (!t || !t.id || t.id === "") {
            return Promise.resolve(false);
        }
        const success = await this.client.sadd(`${cfg.redis.prefixTournaments}by_user:${userId}`, tournamentId);
        return Promise.resolve(success);
    }
    public async removeTournamentForUser(tournamentId: string, userId: string): Promise<boolean> {
        const t = await this.getTournamentById(tournamentId);
        if (!t || !t.id || t.id === "") {
            return Promise.resolve(false);
        }
        const success = await this.client.srem(`${cfg.redis.prefixTournaments}by_user:${userId}`, tournamentId);
        return Promise.resolve(success);
    }
    public async saveTournament(tournament: Tournament, userId: string, eventId: string = ""): Promise<Tournament> {
        tournament.id = tournament.id || this.idGenerator();
        await this.addTournamentToUser(tournament.id, userId);
        if (eventId && eventId !== "") {
            await this.addTournamentToEvent(tournament.id, eventId);
        }
        await this.client.set(`${cfg.redis.prefixTournament}${tournament.id}`, JSON.stringify(tournament));
        return Promise.resolve(tournament);
    }

}
