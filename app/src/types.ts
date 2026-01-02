//Activities
export type ActivityId = string;

export type Activity = {
  id: ActivityId;
  name: string;
  colorHex: string;
  sortOrder: number;
};

//Time Blocks(Timeline)
export type TimeBlock = {
  activityId: ActivityId | null;
  isSkipped: boolean;
};

//Tasks/Planner
export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};
export type TaskCard = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

//Planner Template
export type PlannerTemplate = {
  cards: Array<{
    id: string;
    title: string;
    totalSlot: number;
  }>;
};

//Daily Record
export type DailyRecord = {
  dateKey: string; //YYYY-MM-DD
  blocks: TimeBlock[]; //timeline(30min blocks)
  cards: TaskCard[];
};

//Goals
export type Goal = {
  id: string;
  activityId: ActivityId;
  targetMinutesPerDay: number;
  isEnabled: boolean;
};
