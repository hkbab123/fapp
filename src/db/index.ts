import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = ".data/fapp.sqlite";
fs.mkdirSync(".data", { recursive: true });
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
