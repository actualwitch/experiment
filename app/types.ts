type Message = { message?: string; tool_calls?: object[]; role: string; content?: string };
export type Chat = {messages: Message[]; response: Message};