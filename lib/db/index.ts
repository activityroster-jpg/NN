import { drizzle } from "drizzle-orm/d1";
import { getEnvAsync } from "@/lib/env";
import * as schema from "./schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export async function getDb(): Promise<Db> {
  const env = await getEnvAsync();
  return drizzle(env.DB, { schema });
}

export { schema };
