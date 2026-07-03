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
  files: {
    all: ["files"] as const,
  },
  chat: {
    threads: ["chat", "threads"] as const,
    messages: (threadId: string) => ["chat", "messages", threadId] as const,
    peerReadAt: (threadId: string) => ["chat", "peer-read", threadId] as const,
    directPeer: (threadId: string) => ["chat", "direct-peer", threadId] as const,
    publicGroups: (q: string) => ["chat", "public-groups", q] as const,
    groupDetail: (id: string) => ["chat", "group-detail", id] as const,
    groupMembers: (id: string) => ["chat", "group-members", id] as const,
    groupRequests: (id: string) => ["chat", "group-requests", id] as const,
  },
  leave: {
    types: ["leave", "types"] as const,
    requests: ["leave", "requests"] as const,
  },
  contacts: {
    list: ["contacts", "list"] as const,
    requests: ["contacts", "requests"] as const,
    search: (q: string) => ["contacts", "search", q] as const,
    orgGroups: ["contacts", "org-groups"] as const,
    orgGroupMembers: (groupId: string) => ["contacts", "org-group", groupId] as const,
  },
  profile: {
    current: ["profile", "current"] as const,
  },
} as const;
