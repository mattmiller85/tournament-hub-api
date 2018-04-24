import { Handler, APIGatewayEvent, Context, Callback, CustomAuthorizerEvent } from "aws-lambda";
import { TournamentHubService } from "./TournamentHubService";
import DynamoDBTournamentHubRepo from "./DynamoDBTournamentHubRepo";
import * as uuid from "uuid";

const service = new TournamentHubService(new DynamoDBTournamentHubRepo(uuid.v4));

export const register: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    const reqBody = JSON.parse(event.body);

    const { response, status } = await service.registerUser({
        email: reqBody.email,
        name: reqBody.name,
        password: reqBody.password,
        confirmUrlBase: reqBody.confirmUrlBase
    })

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const login: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    const reqBody = JSON.parse(event.body);

    const { response, status } = await service.login({
        email: reqBody.email,
        password: reqBody.password
    })

    const result = {
        statusCode: status,
        headers: {
            "Access-Control-Allow-Origin": 'http://localhost:3000'
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

const getAuthInfo = async (token: string) => {
    return await service.verifyToken(token);
}

const authFailed = async (cb: Callback, authInfo: any ) => {
    cb(null, {
            statusCode: authInfo.status,
            body: JSON.stringify(authInfo),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    );
    return;
}

export const me: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {
    
    const authInfo = await service.verifyToken(event.headers["Authorization"]);
    if (!authInfo.auth) {
        cb(null, {
            statusCode: 401,
            body: JSON.stringify(authInfo),
            headers: {
                "Access-Control-Allow-Origin": 'http://localhost:3000'
            }
        });
    }
    const { response, status } = await service.getUserById(authInfo.userId);

    const result = {
        statusCode: 200,
        body: JSON.stringify(response || { message: `No user for ${authInfo.userId}`}),
        headers: {
            "Access-Control-Allow-Origin": 'http://localhost:3000'
        }
    }

    cb(null, result);
}

export const confirm: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {

    const { response, status } = await service.confirm(event.pathParameters["userId"]);

    const result = {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response)
    }

    cb(null, result);
}

export const testEnv: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {

    const request = JSON.parse(event.body);
    //const result = await 
    const response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            message: process.env.test_env_var
        })
    }

    cb(null, response);
}