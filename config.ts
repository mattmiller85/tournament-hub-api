import * as dotenv from "dotenv";

dotenv.config();

class DevConfig {
    public static loginUrl = "http://localhost:3000/auth/login/" ;
    public static tokenExpiresSeconds = 86400;
    public static jwtSecret = "this_doesn't_belong_here";

    public static redis = {
        dbIndex: 10,
        prefixEvent: "event:",
        prefixEvents: "events:",
        prefixTournament: "tournament:",
        prefixTournaments: "tournaments:",
        prefixUser: "user:",
        prefixXref: "xref:",
    }
}

export default DevConfig;

export const TH_CONFIRM_PASS = () => {
    return process.env.TH_CONFIRM_PASS;
}

export const TH_CONFIRM_USER = () => {
    return process.env.TH_CONFIRM_USER;
}