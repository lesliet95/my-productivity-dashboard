"use server";

import { revalidatePath } from "next/cache";
import { getData, setData } from "@/lib/actions/userData";
import type { WeddingTask, WeddingSubtask } from "@/lib/types/wedding";

const DEFAULT_TASKS: WeddingTask[] = [
  // Wedding Checklist
  { id: "w1",  title: "Apply for marriage license",               completed: true,  category: "Wedding Checklist" },
  { id: "w2",  title: "Pick up marriage license",                 completed: true,  category: "Wedding Checklist" },
  { id: "w3",  title: "Hire a magistrate for 8/8",                completed: false, category: "Wedding Checklist" },
  { id: "w4",  title: "Buy ticket for Nathan's mom (Thurs–Sun)",  completed: true,  category: "Wedding Checklist" },
  { id: "w5",  title: "Buy ticket for Nathan's dad",              completed: false, category: "Wedding Checklist" },
  { id: "w6",  title: "Pick a dress — Chinese cheongsam",         completed: true,  category: "Wedding Checklist" },
  { id: "w7",  title: "Pick heels",                               completed: false, category: "Wedding Checklist" },
  { id: "w8",  title: "Pick a suit",                              completed: false, category: "Wedding Checklist" },
  { id: "w9",  title: "Make 5-star dinner reservation",           completed: false, category: "Wedding Checklist" },

  // House Maintenance
  { id: "h1",  title: "New shower",                               completed: false, category: "House Maintenance" },
  { id: "h2",  title: "Fix drawer",                               completed: false, category: "House Maintenance" },
  { id: "h3",  title: "Reupholster dining room chairs",           completed: false, category: "House Maintenance" },
  { id: "h4",  title: "Place wood chips in backyard and front yard", completed: false, category: "House Maintenance" },
  { id: "h5",  title: "Organize bedroom and closets",             completed: false, category: "House Maintenance" },
  { id: "h6",  title: "Order mixed fruits jam",                   completed: true,  category: "House Maintenance" },

  // Meals
  { id: "m1",  title: "Thursday breakfast/lunch",                 completed: false, category: "Meals", scheduleDay: "thu" },
  { id: "m2",  title: "Friday lunch downtown",                    completed: false, category: "Meals", scheduleDay: "fri" },
  { id: "m3",  title: "Breakfast options — bacon, eggs, fresh fruit, muffins", completed: false, category: "Meals" },
  { id: "m4",  title: "Spaghetti for Thursday & Friday night with Nathan's mom", completed: false, category: "Meals", scheduleDay: "thu" },
  { id: "m5",  title: "Thursday or Friday night Bittersweet dessert", completed: false, category: "Meals", scheduleDay: "fri" },
  { id: "m6",  title: "Saturday snacks — ginger berry drink, ginger pineapple cherry mint drink, popcorn, hummus & pita, veggies", completed: false, category: "Meals", scheduleDay: "sat" },

  // Week of
  { id: "k1",  title: "Get nails done or paint nails",            completed: false, category: "Week of", scheduleDay: "thu" },
  { id: "k2",  title: "Pick up snacks (popcorn, fruit, nuts, chips, cherry toaster strudel), eggs, drinks (ginger beer), coffee creamer", completed: false, category: "Week of", scheduleDay: "fri" },
  { id: "k3",  title: "Clean house",                              completed: false, category: "Week of", scheduleDay: "thu" },
  { id: "k4",  title: "Cook spaghetti",                           completed: false, category: "Week of", scheduleDay: "thu" },

  // Day of (all Saturday)
  { id: "d1",  title: "Get hair done",                            completed: false, category: "Day of", time: "9:00 AM",  scheduleDay: "sat" },
  { id: "d2",  title: "Transportation — Kevin picks up siblings, mom & dad pick up Nathan's dad", completed: false, category: "Day of", time: "1:30 PM", scheduleDay: "sat" },
  { id: "d3",  title: "Ceremony",                                 completed: false, category: "Day of", time: "2:30 PM", scheduleDay: "sat" },
  { id: "d4",  title: "Head to dinner",                           completed: false, category: "Day of", time: "6:30 PM", scheduleDay: "sat" },
  { id: "d5",  title: "Dinner",                                   completed: false, category: "Day of", time: "7:00 PM", scheduleDay: "sat" },
];

export async function getWeddingTasks(): Promise<WeddingTask[]> {
  const tasks = await getData<WeddingTask[]>("wedding_v1", DEFAULT_TASKS);
  // Migrate existing tasks that don't have scheduleDay set
  return tasks.map((t) => {
    if (t.scheduleDay) return t;
    const defaults = DEFAULT_TASKS.find((d) => d.id === t.id);
    return defaults?.scheduleDay ? { ...t, scheduleDay: defaults.scheduleDay } : t;
  });
}

async function save(tasks: WeddingTask[]) {
  await setData("wedding_v1", tasks);
  revalidatePath("/wedding");
}

export async function toggleWeddingTask(id: string) {
  const tasks = await getWeddingTasks();
  await save(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
}

export async function addWeddingTask(task: Omit<WeddingTask, "id">) {
  const tasks = await getWeddingTasks();
  const newTask: WeddingTask = { ...task, id: `u${Date.now()}` };
  await save([...tasks, newTask]);
  return newTask;
}

export async function deleteWeddingTask(id: string) {
  const tasks = await getWeddingTasks();
  await save(tasks.filter((t) => t.id !== id));
}

export async function updateWeddingTask(id: string, title: string) {
  const tasks = await getWeddingTasks();
  await save(tasks.map((t) => t.id === id ? { ...t, title } : t));
}

export async function updateWeddingTaskFields(id: string, fields: Partial<Pick<WeddingTask, "title" | "time" | "scheduleDay">>) {
  const tasks = await getWeddingTasks();
  await save(tasks.map((t) => t.id === id ? { ...t, ...fields } : t));
}

export async function addSubtask(taskId: string, title: string) {
  const tasks = await getWeddingTasks();
  const subtask: WeddingSubtask = { id: `s${Date.now()}`, title, completed: false };
  await save(tasks.map((t) => t.id === taskId
    ? { ...t, subtasks: [...(t.subtasks ?? []), subtask] }
    : t
  ));
}

export async function toggleSubtask(taskId: string, subtaskId: string) {
  const tasks = await getWeddingTasks();
  await save(tasks.map((t) => t.id === taskId
    ? { ...t, subtasks: (t.subtasks ?? []).map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s) }
    : t
  ));
}

export async function deleteSubtask(taskId: string, subtaskId: string) {
  const tasks = await getWeddingTasks();
  await save(tasks.map((t) => t.id === taskId
    ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) }
    : t
  ));
}

export async function updateSubtask(taskId: string, subtaskId: string, title: string) {
  const tasks = await getWeddingTasks();
  await save(tasks.map((t) => t.id === taskId
    ? { ...t, subtasks: (t.subtasks ?? []).map((s) => s.id === subtaskId ? { ...s, title } : s) }
    : t
  ));
}
