export default class Game {
    public id: string;
    public number: number;
    public team1Id: string;
    public team2Id: string;
    public team1Description: string;
    public team2Description: string;
    public gameDate: Date;
    public location: string;
    public progress: string; // Not Started, In Progress, Finished
    public winnerTeamId: string;
    public bracketGroup: number; // To indicate winners/losers or "region" or something
    public round: number;
}
