export interface ChatMessage {
  id: string;
  parent?: string;
  message: string;
  timestamp?: string;
}
