export type ModelMeta = {
  ModelName: string;
  ModelVersion: string;
  Algorithm: string;
  ProblemType: string;

  FeatureCount: number;
  FeatureDescription: string;

  Dataset: {
    TotalRows: number;
    TrainRows: number;
    TestRows: number;
    SplitRatio?: number;   // เฉพาะโมเดลรุ่นเก่า (แบ่ง train/test ครั้งเดียว)
    Validation?: string;   // โมเดล 2.0.0+: วิธีประเมินผล เช่น k-fold cross-validation
  };

  Metrics: {
    NDCG: number;
    DCG: number;
    Note?: string; // หมายเหตุการอ่านค่า NDCG (มีตั้งแต่โมเดลเวอร์ชัน 1.1.0)
    // โมเดล 2.0.0+: ชนะทุก baseline ทั้ง NDCG@1 และ @3 หรือไม่ (ป้ายกิจกรรมอนาคต / ป้าย lift)
    BeatsBestBaselineAbsolute?: boolean;
    BeatsBestBaselineLift?: boolean;
  };

  // ผลเทียบ baseline (มีตั้งแต่โมเดลเวอร์ชัน 1.1.0)
  // Baselines = วัดด้วยปริมาณกิจกรรมของหมวด, BaselinesLift = วัดว่าหมวดไหนที่ผู้ใช้สนใจ "เกินกว่าความนิยมทั่วไป"
  Baselines?: BaselineTable;
  BaselinesLift?: BaselineTable;

  Training: {
    TrainedAtUtc: string;
    DurationSeconds: number;
    MlNetVersion: string;
  };

  DataSnapshot: {
    UniqueUsers: number; // ผู้ใช้ที่ใช้เทรน
    UniqueCategories: number;
    // โมเดล 2.0.0+ (เทรนครั้งใหม่): ผู้ใช้ทั้งหมดที่มีกิจกรรม และเหตุผลที่ข้าม
    UsersWithActivity?: number;
    UsersSkippedTooFewLogs?: number;
    UsersSkippedNoPast?: number;
    MinLogsPerUser?: number;
  };
};

export type RecommendationDebug = { 
  userId : number;
  totalUserActivity : number;
  comparison : {
    category : string;
    rawScore : number;
    ratio : number;
    mlScore : number;
    percent : number;
    rawRank : number;
    mlRank : number;
    rankChange : number;
    insight : string;
  }[];
}

export type BaselineScore = {
  NdcgAt1: number;
  NdcgAt3: number;
  NdcgAt7: number;
};

/** คีย์: Random, PastCategoryScore, CategoryPopularity, PastRatioLift (เฉพาะ 1.1.0+), LightGBM */
export type BaselineTable = Record<string, BaselineScore>;

export type ActionCountDto = { actionType: string; count: number };

export type TopUserDto = { userId: number; displayName: string;  anonymousId ?: string | null; logs: number; uniquePlaces: number };

export type TopPlaceDto = {
  placeId: number;
  anonymousId ?: string | null;
  displayName : string;
  name?: string | null;
  logs: number;
  uniqueUsers: number;
};

export type DailyActions = {
  dateUtc: string;
  actionType: string;
  count : number;
};

export type Daily = {
  dateUtc: string;
  totalLogs: number;
  placeLogs : number;
  searchLogs : number;
  rowsTrainable : number;
};

export type TrainingStatsDto = {
  days: number;
  sinceUtc: string;
  totalLogs: number;
  placeLogs: number;
  searchLogs: number;
  uniqueUsers: number;
  uniquePlaces: number;
  rowsTrainable: number;
  actions: ActionCountDto[];
  topUsers: TopUserDto[];
  topPlaces: TopPlaceDto[];
  dailyActions: DailyActions[];
  daily: Daily[];
  trainableRate: number;
};
