import { Handler, APIGatewayEvent, Context, Callback } from "aws-lambda";
import { TournamentHubService } from "./TournamentHubService";
import DynamoDBTournamentHubRepo from "./DynamoDBTournamentHubRepo";
import * as uuid from "uuid";

const service = new TournamentHubService(new DynamoDBTournamentHubRepo(uuid.v4));

const getAuthInfo = async (token: string) => {
    return await service.verifyToken(token);
}

const authFailed = async (cb: Callback, authInfo: any ) => {
    cb(null, {
            statusCode: authInfo.status,
            body: JSON.stringify(authInfo),
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:3000'
            }
        }
    );
    return;
}


export const getAll: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const { response, status } = await service.getTournamentsForUser(authInfo.userId);

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify({ tournaments: response })
    }

    cb(null, result);
}

export const getById: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const { response, status } = await service.getTournamentById(event.pathParameters.tournamentId);

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const follow: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const { userId } = JSON.parse(event.body);

    const { response, status } = await service.addTournamentToUser(event.pathParameters.tournamentId, userId);

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const unfollow: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const { userId } = JSON.parse(event.body);

    const { response, status } = await service.removeTournamentForUser(event.pathParameters.tournamentId, userId);

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const add: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const t = JSON.parse(event.body);

    const { status, response } = await service.addTournament(t, authInfo.userId, event.queryStringParameters.eventId);

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const update: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const t = JSON.parse(event.body);

    const { status, response } = await service.updateTournament(t, event.pathParameters.tournamentId, authInfo.userId, event.queryStringParameters.eventId);

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const addGame: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const g = JSON.parse(event.body);

    const { status, response } = await service.addGame(g, event.pathParameters.tournamentId, authInfo.userId, "");

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const saveGame: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await getAuthInfo(event.headers["Authorization"]);
    if (!authInfo.auth) {
        return authFailed(cb, authInfo);
    }

    const g = JSON.parse(event.body);

    const { status, response } = await service.updateGame(g, event.pathParameters.tournamentId, authInfo.userId, "");

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}