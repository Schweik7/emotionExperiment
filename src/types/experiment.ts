export interface RatingData {
    excited: { intensity: number; frequency: number };
    alert: { intensity: number; frequency: number };
    tense: { intensity: number; frequency: number };
    anxious: { intensity: number; frequency: number };
    terrified: { intensity: number; frequency: number };
    desperate: { intensity: number; frequency: number };
    physical: number;
    psychological: number;
}