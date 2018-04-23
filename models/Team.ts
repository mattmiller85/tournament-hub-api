export default interface Team {
    name: string;
    id: string; // only unique within a tournament
    roster: Array<{ name: string, number: number, isActive: boolean }>;
    color: string;
}