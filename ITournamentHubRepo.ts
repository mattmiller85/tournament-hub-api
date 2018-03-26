import Event from "./models/Event";
import Tournament from "./models/Tournament";
import User from "./models/User";

export interface ITournamentHubRepo {

    findUserByEmail(email: string): Promise<User>;
    login(email: string, password: string): Promise<boolean>;
    register(user: User, password: string): Promise<User>;

    getEventsForUser(userId: string): Promise<Event[]>;
    getTournamentsForEvent(eventId: string): Promise<Tournament[]>;
    getTournamentsForUser(userId: string): Promise<Tournament[]>;

}
