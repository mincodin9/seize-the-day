export type ActivityId = string;

export type Activity = {
  id: ActivityId;
  name: string;
  colorHex: string;
  sortOrder: number;
};

export type Block = {
  activityId: ActivityId | null;
  isSkipped: boolean;
};

export type DayRecord = {
  //YYYY-MM-DD
  date: string;
  blocks: Block[]; //length = 48
};

export type Goal = {
  id: string;
  activityId: ActivityId;
  //120 = 2 hours
  targetMinutesPerDay: number;
  isEnabled: boolean;
};
