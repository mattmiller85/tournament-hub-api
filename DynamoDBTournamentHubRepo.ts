import * as bcrypt from "bcryptjs"
import { promisify } from "util";
import { config as awsconfig, DynamoDB } from "aws-sdk"

import cfg from "./config";
import { ITournamentHubRepo } from "./ITournamentHubRepo";
import Event from "./models/Event";
import Tournament from "./models/Tournament";
import User from "./models/User";

export default class DynamoDBTournamentHubRepo implements ITournamentHubRepo {

    private hgetAsync: (key: string, hashKey: string) => Promise<string>;
    //private queryAsync: (key: string) => Promise<string>;
    private smembersAsync: (key: string) => Promise<string[]>;
    private client: DynamoDB.DocumentClient;

    constructor(public idGenerator: () => string) {
        awsconfig.update({
            region: "us-east-2"
        });
        this.client = new DynamoDB.DocumentClient({ 
            region: "us-east-2",
            convertEmptyValues: true,
            accessKeyId: "somethingforlocal", 
            secretAccessKey: "fake_for_local_here",
            endpoint: "http://localhost:8000"
        });
    }
    public async findUserByEmail(email: string): Promise<User> {
        const queryResponse =  await this.client.get({
            TableName : "UserEmails",
            Key: { "email": email }
        }).promise();

        if (!queryResponse.Item)
            return Promise.resolve(null);

        let user = await this.findUserById(queryResponse.Item.userId);
        
        return Promise.resolve(user as User);
    }
    public async findUserById(userId: string): Promise<User> {
        const queryResponse = await this.client.get({
            TableName: "Users",
            Key: { "id": userId },
        }).promise();
        
        return Promise.resolve(queryResponse.Item as User);
    }
    public async saveUser(user: User): Promise<boolean> {
        
        let queryResponse = await this.client.put({
            TableName: "Users",
            Item: user,
        }).promise();
        
        if(!queryResponse.$response || !queryResponse.$response.data)
            return Promise.reject(`Couldn't save user ${user.id}.`);

        queryResponse = await this.client.put({
                TableName: "UserEmails",
                Item: { email: user.email, userId: user.id },
            }).promise();

        if(!queryResponse.$response || !queryResponse.$response.data)
            return Promise.reject(`Error updating user email index for user ${user.id}.`);

        return Promise.resolve(true)
    }
    public async removeUser(userId: string): Promise<boolean> {
        const user = await this.findUserById(userId);
        if (!user || !user.id) {
            return Promise.resolve(false);
        }
        let queryResponse = await this.client.delete({
            TableName: "Users",
            Key: { "id": userId },
        }).promise();
        
        if(!queryResponse.$response || !queryResponse.$response.data)
            return Promise.resolve(false);

        queryResponse = await this.client.delete({
                TableName: "UserEmails",
                Key: { "email": user.email },
            }).promise();
        
        if(!queryResponse.$response || !queryResponse.$response.data)
            return Promise.resolve(false);

        return Promise.resolve(true);
    }

    public async login(email: string, password: string): Promise<User> {
        const user = await this.findUserByEmail(email);
        if (!user || !user.isConfirmed) {
            return Promise.resolve(null);
        }
        const actualHashedPwd = (await this.client.get({
            TableName: "Passwords",
            Key: { "userId": user.id },
        }).promise()).Item.password;

        if (bcrypt.compareSync(password, actualHashedPwd)) {
            return Promise.resolve(user);
        }
        return Promise.resolve(null);
    }

    public async register(user: User, password: string): Promise<User> {
        const existingUser = await this.findUserByEmail(user.email);
        if (existingUser) {
            return Promise.resolve(existingUser);
        }
        user.id = this.idGenerator();
        password = await bcrypt.hash(password, 8);
        await this.saveUser(user)

        const queryResponse = await this.client.put({
            TableName: "Passwords",
            Item: { userId: user.id, password },
        }).promise();
        
        return Promise.resolve(user);
    }



    public async getEventById(eventId: string): Promise<Event> {
        const queryResponse = await this.client.get({
            TableName: "Events",
            Key: { "id": eventId },
        }).promise();

        if (!queryResponse.Item)
            return Promise.reject(`No event found with id ${eventId}.`);
        
        return Promise.resolve(queryResponse.Item as Event);
    }
    public async getEventsForUser(userId: string): Promise<Event[]> {
        const queryResponse = await this.client.get({
            TableName: "UserEvents",
            Key: { "userId": userId },
        }).promise();

        if (!queryResponse.Item)
            return Promise.resolve([]);
        
        const events = await Promise.all<Event>(queryResponse.Item.eventIds.map(eid => this.getEventById(eid)));
        return Promise.resolve(events);
    }
    public async saveEvent(event: Event, userId: string): Promise<Event> {
        event.id = event.id || this.idGenerator();
        
        let queryResponse = await this.client.put({
            TableName: "Events",
            Item: event,
        }).promise();
        
        if (!queryResponse.$response || !queryResponse.$response.data) {
            return Promise.reject(`Couldn't save event ${event.id}.`);
        }

        if (!userId || userId === '') {
            return Promise.resolve(event);
        }

        try {
            await this.client.update({
                TableName: "UserEvents",
                Key: { userId },
                UpdateExpression: "SET eventIds = list_append(if_not_exists(eventIds, :empty_list), :eids)",
                ConditionExpression: "NOT contains (eventIds, :eid)",
                ExpressionAttributeValues: {
                    ':eids': [event.id],
                    ':eid': event.id,
                    ':empty_list': []
                },
                ReturnValues: "UPDATED_NEW"
            }).promise();
        } catch(ex) {
            if (ex.message !== "The conditional request failed")
                throw ex;
        }

        return Promise.resolve(event);
    }

    public async getTournamentById(tournamentId: string): Promise<Tournament> {
        const queryResponse = await this.client.get({
            TableName: "Tournaments",
            Key: { "id": tournamentId },
        }).promise();

        if (!queryResponse.Item)
            return Promise.resolve(null);
        
        return Promise.resolve(queryResponse.Item as Tournament);
    }
    public async getTournamentsForEvent(eventId: string): Promise<Tournament[]> {
        const queryResponse = await this.client.get({
            TableName: "EventTournaments",
            Key: { eventId },
        }).promise();

        if (!queryResponse.Item)
            return Promise.resolve([]);
        
        const tournaments = await Promise.all<Tournament>(queryResponse.Item.tournamentIds.map(tid => this.getTournamentById(tid)));
        return Promise.resolve(tournaments);
    }
    public async getTournamentsForUser(userId: string): Promise<Tournament[]> {
        const queryResponse = await this.client.get({
            TableName: "UserTournaments",
            Key: { "userId": userId },
        }).promise();

        if (!queryResponse.Item)
            return Promise.resolve([]);
        
        const tournaments = await Promise.all<Tournament>(queryResponse.Item.tournamentIds.map(tid => this.getTournamentById(tid)));
        return Promise.resolve(tournaments);
    }
    public async addTournamentToEvent(tournamentId: string, eventId: string): Promise<boolean> {
        try {
            const queryResponse = await this.client.update({
                TableName: "EventTournaments",
                Key: { eventId },
                UpdateExpression: "SET tournamentIds = list_append(if_not_exists(tournamentIds, :empty_list), :tids)",
                ConditionExpression: "attribute_not_exists(tournamentIds) OR not contains (tournamentIds, :tid)",
                ExpressionAttributeValues: {
                    ':tids': [tournamentId],
                    ':tid': tournamentId,
                    ':empty_list': []
                },
                ReturnValues: "UPDATED_NEW"
            }).promise();
            
            if(!queryResponse.$response || !queryResponse.$response.data)
                return Promise.reject(`Couldn't add tournament for event.`);
        } catch(ex) {
            if (ex.message !== "The conditional request failed")
                throw ex;
        }

        return Promise.resolve(true)
    }
    public async addTournamentToUser(tournamentId: string, userId: string): Promise<boolean> {

        try {
            const queryResponse = await this.client.update({
                TableName: "UserTournaments",
                Key: { userId },
                UpdateExpression: "SET tournamentIds = list_append(if_not_exists(tournamentIds, :empty_list), :tids)",
                ConditionExpression: "attribute_not_exists(tournamentIds) OR not contains (tournamentIds, :tid)",
                ExpressionAttributeValues: {
                    ':tids': [tournamentId],
                    ':tid': tournamentId,
                    ':empty_list': []
                },
                ReturnValues: "UPDATED_NEW"
            }).promise();
            
            if(!queryResponse.$response || !queryResponse.$response.data)
                return Promise.reject(`Couldn't add tournament for user.`);
        
        } catch(ex) {
            if (ex.message !== "The conditional request failed")
                throw ex;
        }
        return Promise.resolve(true)
    }
    public async removeTournamentForUser(tournamentId: string, userId: string): Promise<boolean> {
        const queryResponse = await this.client.update({
            TableName: "UserTournaments",
            Key: { userId },
            UpdateExpression: "DELETE tournamentIds :tid)",
            ExpressionAttributeValues: {
                ':tid': [tournamentId],
            },
            ReturnValues: "ALL_NEW"
        }).promise();
        
        if(!queryResponse.$response || !queryResponse.$response.data)
            return Promise.reject(`Couldn't renmove tournament for user.`);

        return Promise.resolve(true)
    }
    public async saveTournament(tournament: Tournament, userId: string, eventId: string = ""): Promise<Tournament> {
        tournament.id = tournament.id || this.idGenerator();
        const queryResponse = await this.client.put({
            TableName: "Tournaments",
            Item: tournament
        }).promise();

        if(!queryResponse.$response || !queryResponse.$response.data)
            return Promise.reject(`Couldn't save tournament ${tournament.id}.`);
        
        if (userId && userId !== '') {
            await this.addTournamentToUser(tournament.id, userId);
        }

        if (eventId && eventId !== '') {
            await this.addTournamentToEvent(tournament.id, eventId);
        }

        return Promise.resolve(tournament);
    }

}
