import { ServerMockExecutionProvider } from "./mock-provider";
import type { ServerExecutionProvider } from "./provider";

const provider: ServerExecutionProvider = new ServerMockExecutionProvider();

export function getServerExecutionProvider(): ServerExecutionProvider {
  return provider;
}
