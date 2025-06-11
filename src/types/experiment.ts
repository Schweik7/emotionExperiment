export interface RatingData {
    excited: { intensity: number; frequency: number };
    // alert 部分已删除
    tense: { intensity: number; frequency: number };
    anxious: { intensity: number; frequency: number };
    terrified: { intensity: number; frequency: number };
    desperate: { intensity: number; frequency: number };
    physical: number;
    psychological: number;
}

export interface WatchTimeData {
    startTime: string;
    endTime: string;
}