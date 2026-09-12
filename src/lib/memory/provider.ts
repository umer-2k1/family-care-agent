import type { MemoryRecord } from "@/types/care";

export type AddMemoryInput = Omit<MemoryRecord, "id">;
export type SearchMemoryInput = { memberId: string; query: string };

export interface MemoryProvider {
  addMemory(input: AddMemoryInput): Promise<MemoryRecord>;
  searchMemory(input: SearchMemoryInput): Promise<MemoryRecord[]>;
  updateMemory(input: MemoryRecord): Promise<MemoryRecord>;
  getGraph?(memberId: string): Promise<unknown>;
  deleteMemory?(id: string): Promise<void>;
}
