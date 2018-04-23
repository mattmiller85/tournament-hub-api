import Game from "./Game";
import { TournamentType } from "./TournamentType";
import Team from "./Team";

export default interface Tournament {
    id?: string;
    name: string;
    type: TournamentType;
    numTeams: number;
    games: Game[];
}
