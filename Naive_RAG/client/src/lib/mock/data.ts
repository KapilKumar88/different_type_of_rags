export type DocStatus = "Indexed" | "Processing" | "Failed";
export type DocType = "pdf" | "docx" | "txt" | "csv" | "md";

export type Document = {
  id: string;
  name: string;
  type: DocType;
  size: string;
  uploadedAt: string;
  status: DocStatus;
  chunks: number;
  tokens: number;
};

export const mockDocuments: Document[] = [
  {
    id: "d1",
    name: "employee-policy.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedAt: "2026-04-28",
    status: "Indexed",
    chunks: 142,
    tokens: 38_420,
  },
  {
    id: "d2",
    name: "onboarding-guide.pdf",
    type: "pdf",
    size: "1.1 MB",
    uploadedAt: "2026-04-27",
    status: "Indexed",
    chunks: 78,
    tokens: 21_010,
  },
  {
    id: "d3",
    name: "engineering-handbook.docx",
    type: "docx",
    size: "812 KB",
    uploadedAt: "2026-04-26",
    status: "Indexed",
    chunks: 96,
    tokens: 26_540,
  },
  {
    id: "d4",
    name: "q1-financials.csv",
    type: "csv",
    size: "318 KB",
    uploadedAt: "2026-04-25",
    status: "Indexed",
    chunks: 24,
    tokens: 6_120,
  },
  {
    id: "d5",
    name: "security-checklist.md",
    type: "md",
    size: "42 KB",
    uploadedAt: "2026-04-24",
    status: "Indexed",
    chunks: 18,
    tokens: 4_280,
  },
  {
    id: "d6",
    name: "product-roadmap-2026.pdf",
    type: "pdf",
    size: "3.7 MB",
    uploadedAt: "2026-04-22",
    status: "Processing",
    chunks: 0,
    tokens: 0,
  },
  {
    id: "d7",
    name: "customer-interviews.txt",
    type: "txt",
    size: "186 KB",
    uploadedAt: "2026-04-20",
    status: "Indexed",
    chunks: 32,
    tokens: 9_840,
  },
  {
    id: "d8",
    name: "legacy-export.pdf",
    type: "pdf",
    size: "5.2 MB",
    uploadedAt: "2026-04-15",
    status: "Failed",
    chunks: 0,
    tokens: 0,
  },
];

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
  tokens: number;
  refs: number;
};

export const mockChats: ChatSummary[] = [
  {
    id: "c1",
    title: "Parental leave policy questions",
    updatedAt: "2h ago",
    tokens: 2_430,
    refs: 2,
  },
  {
    id: "c2",
    title: "How do we onboard a new engineer?",
    updatedAt: "Yesterday",
    tokens: 4_120,
    refs: 3,
  },
  { id: "c3", title: "Q1 revenue breakdown", updatedAt: "2d ago", tokens: 1_840, refs: 1 },
  { id: "c4", title: "Security review checklist", updatedAt: "3d ago", tokens: 3_210, refs: 2 },
  { id: "c5", title: "Customer pain points summary", updatedAt: "5d ago", tokens: 5_640, refs: 4 },
  { id: "c6", title: "Roadmap priorities for Q2", updatedAt: "1w ago", tokens: 2_980, refs: 2 },
];

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

export const mockMessages: Message[] = [
  {
    id: "m1",
    role: "user",
    content: "What's our parental leave policy and who is eligible?",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Based on the documents you've uploaded, here's a summary of the **parental leave policy**:\n\n- **Eligibility**: All full-time employees who have completed at least **6 months** of continuous service.\n- **Duration**: Up to **16 weeks** of paid leave for primary caregivers, and **6 weeks** for secondary caregivers.\n- **Pay**: 100% of base salary for the full duration.\n- **Top-up**: Government benefits are topped up by the company so total pay equals 100%.\n\n> Note: contractors and interns are not currently covered. See section 4.2 of the handbook for details.\n\nLet me know if you'd like the request process steps as well.",
    sources: ["employee-policy.pdf · p.12", "engineering-handbook.docx · p.34"],
  },
  {
    id: "m3",
    role: "user",
    content: "Yes, what's the process to request it?",
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Here's the **request process**:\n\n1. Notify your manager at least **30 days** in advance.\n2. Submit the leave request form via the HR portal.\n3. HR confirms eligibility within **5 business days**.\n4. Coordinate handover plan with your team lead.\n5. Final approval is sent via email with start/end dates.\n\nFor unexpected circumstances, the 30-day notice can be waived with manager approval.",
    sources: ["employee-policy.pdf · p.13", "onboarding-guide.pdf · p.7"],
  },
];

export const suggestedPrompts = [
  "Summarize the employee handbook in 5 bullets",
  "What's our refund policy?",
  "How do we onboard a new engineer?",
  "Compare Q1 vs Q4 revenue from the financials",
];

// Usage stats
export const tokensByDay = [
  { day: "Apr 21", tokens: 4200 },
  { day: "Apr 22", tokens: 6100 },
  { day: "Apr 23", tokens: 3800 },
  { day: "Apr 24", tokens: 8900 },
  { day: "Apr 25", tokens: 7200 },
  { day: "Apr 26", tokens: 5400 },
  { day: "Apr 27", tokens: 9800 },
  { day: "Apr 28", tokens: 11200 },
  { day: "Apr 29", tokens: 8400 },
  { day: "Apr 30", tokens: 12600 },
  { day: "May 01", tokens: 9100 },
  { day: "May 02", tokens: 7800 },
  { day: "May 03", tokens: 10400 },
  { day: "May 04", tokens: 6200 },
];

export const tokensByChat = mockChats.map((c) => ({
  name: c.title.slice(0, 24),
  tokens: c.tokens,
}));
