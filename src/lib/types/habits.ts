export interface CustomHabit {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  goal: number; // days per week (1-7)
  section: "daily" | "devotional";
  order: number;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
}

export interface HabitData {
  habits: CustomHabit[];
  logs: HabitLog[];
  sectionNames: {
    daily: string;
    devotional: string;
  };
}
