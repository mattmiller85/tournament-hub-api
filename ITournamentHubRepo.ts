import Event from "./models/Event";
import Tournament from "./models/Tournament";
import User from "./models/User";

export interface ITournamentHubRepo {

    findUserByEmail(email: string): Promise<User>;
    findUserById(id: string): Promise<User>;
    login(email: string, password: string): Promise<User>;
    register(user: User, password: string): Promise<User>;
    saveUser(user: User): Promise<boolean>
    removeUser(id: string): Promise<boolean>

    getEventsForUser(userId: string): Promise<Event[]>;
    getEventById(eventId: string): Promise<Event>;
    saveEvent(event: Event, userId: string): Promise<Event>

    getTournamentById(tournamentId: string): Promise<Tournament>;
    getTournamentsForEvent(eventId: string): Promise<Tournament[]>;
    getTournamentsForUser(userId: string): Promise<Tournament[]>;
    addTournamentToEvent(tournamentId: string, eventId: string): Promise<boolean>;
    addTournamentToUser(tournamentId: string, userId: string): Promise<boolean>;
    removeTournamentForUser(tournamentId: string, userId: string): Promise<boolean>;
    saveTournament(tournament: Tournament, userId: string, eventId: string): Promise<Tournament>;
}
