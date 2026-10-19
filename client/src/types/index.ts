export type Citation = {
  id: string;
  label: string;
  sourceId: string;
  quote: string;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  time: string;
  bullets?: {
    title: string;
    detail: string;
  }[];
  ending?: string;
  citations?: Citation[];
};

export type SourceDocument = {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "TXT";
  pages: number;
  added: string;
  color: "blue" | "amber" | "rose";
  excerpt: string;
};