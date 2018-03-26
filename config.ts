class DevConfig {
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
