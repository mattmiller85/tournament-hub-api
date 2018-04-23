import Team from "./Team";

export default interface Game {
    id: string; // only unique within a tournament
    number: number;
    team1: Team;
    team2: Team;
    gameDate: Date;
    location: string;
    progress: string; // Not Started, In Progress, Finished
    winnerTeamId: string;
    bracketGroup: number; // To indicate winners/losers or "region" or something
    round: number;
}
