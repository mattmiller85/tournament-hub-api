// tslint:disable:no-unused-expression
// tslint:disable:no-implicit-dependencies

import { expect } from "chai";
import { slow, suite, test, timeout } from "mocha-typescript";
import Event from "../models/Event";
import Game from "../models/Game";
import Tournament from "../models/Tournament";
import { TournamentType } from "../models/TournamentType";
import User from "../models/User";
import repo from "../DynamoDBTournamentHubRepo";

@suite class DynamoDBTournamentHubRepoTests {
    private testRepo: repo;
    constructor() {
        this.testRepo = new repo(() => "123456789abcdefg");
    }

    @test public async shouldCreateUserIdWhenRegistering() {

        await this.testRepo.removeUser("123456789abcdefg");
        const userToCreate = {
            email: "test@test.com",
            name: "Test User",
            roles: ["admin, readonly"]
        }

        const pwdToUse = "testpassword";
        const createdUser = await this.testRepo.register(userToCreate, pwdToUse);

        expect(createdUser.id).to.not.be.empty;
    }

    @test public async shouldCreateUserAndLoginWithPasswordIfConfirmed() {

        await this.testRepo.removeUser("123456789abcdefg");
        const userToCreate = {
            email: "test@test.com",
            name: "Test User",
            roles: ["admin, readonly"],
            isConfirmed: true
        }

        const pwdToUse = "testpassword";
        await this.testRepo.register(userToCreate, pwdToUse);
        const loggedIn = await this.testRepo.login("test@test.com", "testpassword");

        expect(loggedIn.name).to.equal("Test User");
    }

    @test public async shouldCreateUserAndNotLoginWithPasswordIfNotConfirmed() {

        await this.testRepo.removeUser("123456789abcdefg");
        const userToCreate = {
            email: "test@test.com",
            name: "Test User",
            roles: ["admin, readonly"],
            isConfirmed: false
        }

        const pwdToUse = "testpassword";
        await this.testRepo.register(userToCreate, pwdToUse);
        const loggedIn = await this.testRepo.login("test@test.com", "testpassword");

        expect(loggedIn).to.be.null;
    }

    @test public async shouldSaveEventAndIndexByUser() {

        const userId = "123456789abcdefg";
        const eventToSave = {
            eventDate: new Date(),
            name: "Test Event"
        };

        await this.testRepo.saveEvent(eventToSave, userId);
        const loadedEventById = await this.testRepo.getEventById("123456789abcdefg");
        const loadedEventsByUser = await this.testRepo.getEventsForUser(userId);

        expect(loadedEventById).to.not.be.null;
        expect(loadedEventById.name).to.equal("Test Event");
        expect(loadedEventsByUser).to.not.be.null;
        expect(loadedEventsByUser.map((e) => e.name)).to.contain("Test Event");
    }

    @test public async shouldSaveTournamentAndIndexByUser() {

        const userId = "123456789abcdefg";
        const tourneyToSave = {
            name: "Test Tournament",
            type: TournamentType.SingleElimination,
            numTeams: 4,
            games: [
                {
                    gameDate: new Date(),
                    id: "12345",
                    location: "Some Gym",
                    number: 1,
                    progress: "in_progress",
                    team1: { name: "Good Guys", id: "23456", roster: [], color: "" },
                    team2: { name: "Bad Guys", id: "34567", roster: [], color: "" },
                    winnerTeamId: "",
                    bracketGroup: 1,
                    round: 1
                }
            ]
        };

        await this.testRepo.saveTournament(tourneyToSave, userId);
        const loadedTourneyById = await this.testRepo.getTournamentById("123456789abcdefg");
        const loadedTourneysByUser = await this.testRepo.getTournamentsForUser(userId);

        expect(loadedTourneyById).to.not.be.null;
        expect(loadedTourneyById.name).to.equal("Test Tournament");
        expect(loadedTourneyById.type).to.equal(TournamentType.SingleElimination);
        expect(loadedTourneysByUser).to.not.be.null;
        expect(loadedTourneysByUser.map((e) => e.name)).to.contain("Test Tournament");
    }

    @test public async shouldSaveTournamentAndIndexByEvent() {

        const userId = "123456789abcdefg";
        const tourneyToSave = {
            name: "Test Tournament",
            type: TournamentType.SingleElimination,
            numTeams: 8,
            games: [
                {
                    gameDate: new Date(),
                    id: "12345",
                    location: "Some Gym",
                    number: 1,
                    progress: "in_progress",
                    team1: { name: "Good Guys", id: "23456", roster: [], color: "Blue" },
                    team2: { name: "Bad Guys", id: "34567", roster: [], color: "Red" },
                    winnerTeamId: "",
                    bracketGroup: 1,
                    round: 1
                },
                {
                    gameDate: new Date(),
                    id: "12346",
                    location: "Some Other Gym",
                    number: 2,
                    progress: "finished",
                    team1: { name: "Good Guys", id: "23456", roster: [], color: "LightBlue" },
                    team2: { name: "Bad Guys", id: "34567", roster: [], color: "Gray    " },
                    winnerTeamId: "34567",
                    bracketGroup: 1,
                    round: 1
                },
                {
                    gameDate: new Date(),
                    id: "12347",
                    location: "Gym 3",
                    number: 3,
                    progress: "finished",
                    team1: { name: "Good Guys Again", id: "23456", roster: [], color: "" },
                    team2: { name: "Guys", id: "34567", roster: [], color: "" },
                    winnerTeamId: "34567",
                    bracketGroup: 1,
                    round: 1
                },
                {
                    gameDate: new Date(),
                    id: "12348",
                    location: "Gym 4",
                    number: 4,
                    progress: "finished",
                    team1: { name: "Good Guys Again", id: "23456", roster: [], color: "" },
                    team2: { name: "Guys", id: "34567", roster: [], color: "" },
                    winnerTeamId: "34567",
                    bracketGroup: 1,
                    round: 1
                },
                {
                    gameDate: new Date(),
                    id: "12349",
                    location: "Gym 4",
                    number: 5,
                    progress: "not_started",
                    team1: { name: "Winner Game 1", id: "", roster: [], color: "" },
                    team2: { name: "Winner Game 2", id: "", roster: [], color: "" },
                    winnerTeamId: "",
                    bracketGroup: 1,
                    round: 2
                },
                {
                    gameDate: new Date(),
                    id: "12350",
                    location: "Gym 4",
                    number: 6,
                    progress: "not_started",
                    team1: { name: "Winner Game 3", id: "", roster: [], color: "" },
                    team2: { name: "Winner Game 4", id: "", roster: [], color: "" },
                    winnerTeamId: "",
                    bracketGroup: 1,
                    round: 2
                },
                {
                    gameDate: new Date(),
                    id: "12351",
                    location: "Gym 4",
                    number: 7,
                    progress: "not_started",
                    team1: { name: "Winner Game 5", id: "", roster: [], color: "" },
                    team2: { name: "Winner Game 6", id: "", roster: [], color: "" },
                    winnerTeamId: "",
                    bracketGroup: 1,
                    round: 3
                }
            ]
        };

        await this.testRepo.saveTournament(tourneyToSave, userId, "54321");
        const loadedTourneyById = await this.testRepo.getTournamentById("123456789abcdefg");
        const loadedTourneysByEvent = await this.testRepo.getTournamentsForEvent("54321");

        expect(loadedTourneyById).to.not.be.null;
        expect(loadedTourneysByEvent).to.not.be.null;
        expect(loadedTourneysByEvent.map((e) => e.name)).to.contain("Test Tournament");
        expect(loadedTourneysByEvent.map((e) => e.games[1].team1.name)[0]).to.equal("Good Guys");
    }
}
