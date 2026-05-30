export const queryKeys = {
  attendance: {
    all: ["attendance"] as const,
    week: (weekId: string) => ["attendance", "week", weekId] as const,
    detail: (workerId: string) => ["attendance", "detail", workerId] as const,
  },
  services: {
    all: ["services"] as const,
    categories: ["services", "categories"] as const,
  },
  news: {
    all: ["news"] as const,
    detail: (id: string) => ["news", id] as const,
  },
  files: {
    all: ["files"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
  leave: {
    types: ["leave", "types"] as const,
    requests: ["leave", "requests"] as const,
  },
  phoneDirectory: {
    all: ["phone-directory"] as const,
    byDepartment: (deptId: string) => ["phone-directory", "dept", deptId] as const,
    byHeltes: (heltesId: string) => ["phone-directory", "heltes", heltesId] as const,
  },
  profile: {
    current: ["profile", "current"] as const,
  },
} as const;
