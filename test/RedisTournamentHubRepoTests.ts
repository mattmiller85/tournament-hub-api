// tslint:disable:no-unused-expression
// tslint:disable:no-implicit-dependencies

import { expect } from "chai";
import { slow, suite, test, timeout } from "mocha-typescript";
import Event from "../models/Event";
import Game from "../models/Game";
import Tournament from "../models/Tournament";
import { TournamentType } from "../models/TournamentType";
import User from "../models/User";
import repo from "../RedisTournamentHubRepo";

@suite class RedisTournamentHubRepoTests {
    private testRepo: repo;
    constructor() {
        this.testRepo = new repo(() => "123456789abcdefg");
    }

    @test public async shouldCreateUserIdWhenRegistering() {

        await this.testRepo.removeUser("123456789abcdefg");
        const userToCreate = new User();
        userToCreate.email = "test@test.com";
        userToCreate.name = "Test User";
        userToCreate.roles = ["admin, readonly"]

        const pwdToUse = "testpassword";
        const createdUser = await this.testRepo.register(userToCreate, pwdToUse);

        expect(createdUser.id).to.not.be.empty;
    }

    @test public async shouldCreateUserAndLoginWithPasswordIfConfirmed() {

        await this.testRepo.removeUser("123456789abcdefg");
        const userToCreate = new User();
        userToCreate.email = "test@test.com";
        userToCreate.name = "Test User";
        userToCreate.roles = ["admin, readonly"]
        userToCreate.isConfirmed = true;

        const pwdToUse = "testpassword";
        await this.testRepo.register(userToCreate, pwdToUse);
        const loggedIn = await this.testRepo.login("test@test.com", "testpassword");

        expect(loggedIn.name).to.equal("Test User");
    }

    @test public async shouldCreateUserAndNotLoginWithPasswordIfNotConfirmed() {

        await this.testRepo.removeUser("123456789abcdefg");
        const userToCreate = new User();
        userToCreate.email = "test@test.com";
        userToCreate.name = "Test User";
        userToCreate.roles = ["admin, readonly"]
        userToCreate.isConfirmed = false;

        const pwdToUse = "testpassword";
        await this.testRepo.register(userToCreate, pwdToUse);
        const loggedIn = await this.testRepo.login("test@test.com", "testpassword");

        expect(loggedIn).to.be.null;
    }

    @test public async shouldSaveEventAndIndexByUser() {

        const userId = "123456789abcdefg";
        const eventToSave = new Event();
        eventToSave.eventDate = new Date();
        eventToSave.name = "Test Event";

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
        const tourneyToSave = new Tournament();
        tourneyToSave.name = "Test Tournament";
        tourneyToSave.type = TournamentType.DoubleElimination;
        tourneyToSave.games = new Array<Game>();
        tourneyToSave
            .games
            .push({
                gameDate: new Date(),
                id: "12345",
                location: "Some Gym",
                number: 1,
                progress: "in_progress",
                team1Description: "Good Guys",
                team1Id: "23456",
                team2Description: "Bad Guys",
                team2Id: "34567",
                winnerTeamId: "",
            });

        await this.testRepo.saveTournament(tourneyToSave, userId);
        const loadedTourneyById = await this.testRepo.getTournamentById("123456789abcdefg");
        const loadedTourneysByUser = await this.testRepo.getTournamentsForUser(userId);

        expect(loadedTourneyById).to.not.be.null;
        expect(loadedTourneyById.name).to.equal("Test Tournament");
        expect(loadedTourneyById.type).to.equal(TournamentType.DoubleElimination);
        expect(loadedTourneysByUser).to.not.be.null;
        expect(loadedTourneysByUser.map((e) => e.name)).to.contain("Test Tournament");
    }

    @test public async shouldSaveTournamentAndIndexByEvent() {

        const userId = "123456789abcdefg";
        const tourneyToSave = new Tournament();
        tourneyToSave.name = "Test Tournament";
        tourneyToSave.type = TournamentType.DoubleElimination;
        tourneyToSave.games = new Array<Game>();
        tourneyToSave
            .games
            .push({
                gameDate: new Date(),
                id: "12345",
                location: "Some Gym",
                number: 1,
                progress: "in_progress",
                team1Description: "Good Guys",
                team1Id: "23456",
                team2Description: "Bad Guys",
                team2Id: "34567",
                winnerTeamId: "",
            },
            {
                gameDate: new Date(),
                id: "12346",
                location: "Some Other Gym",
                number: 2,
                progress: "finished",
                team1Description: "Good Guys",
                team1Id: "23456",
                team2Description: "Bad Guys",
                team2Id: "34567",
                winnerTeamId: "34567",
            });

        await this.testRepo.saveTournament(tourneyToSave, userId, "54321");
        const loadedTourneyById = await this.testRepo.getTournamentById("123456789abcdefg");
        const loadedTourneysByEvent = await this.testRepo.getTournamentsForEvent("54321");

        expect(loadedTourneyById).to.not.be.null;
        expect(loadedTourneysByEvent).to.not.be.null;
        expect(loadedTourneysByEvent.map((e) => e.name)).to.contain("Test Tournament");
    }
}
