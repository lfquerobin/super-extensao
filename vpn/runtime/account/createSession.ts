import { saveSession } from "./saveSession";

export async function createSession(): Promise<void> {
  await saveSession({});
}
