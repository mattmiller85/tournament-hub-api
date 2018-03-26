import Game from "./Game";
import { TournamentType } from "./TournamentType";

export default class Tournament {
    public id: string;
    public name: string;
    public type: TournamentType;
    public games: Game[];
}
