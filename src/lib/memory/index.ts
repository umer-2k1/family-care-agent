import type { MemoryProvider } from "./provider";
import { CogneeMemoryProvider } from "./cognee";
import { Mem0MemoryProvider } from "./mem0";

export function getMemoryProvider(): MemoryProvider {
  return process.env.MEMORY_PROVIDER === "mem0" ? new Mem0MemoryProvider() : new CogneeMemoryProvider();
}
