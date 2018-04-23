import { Handler, APIGatewayEvent, Context, Callback } from "aws-lambda";
//import { TournamentHubService } from "./TournamentHubService";

//const service = new TournamentHubService(new Tourna)

export const register: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {

    const request = JSON.parse(event.body);

    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: "testing, 123 here"
        })
    }

    cb(null, response);
}

export const testEnv: Handler = async (event: APIGatewayEvent, context: Context, cb: Callback) => {

    const request = JSON.parse(event.body);
    //const result = await 
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: process.env.test_env_var
        })
    }

    cb(null, response);
}