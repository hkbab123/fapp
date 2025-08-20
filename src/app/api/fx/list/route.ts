import { NextResponse } from "next/server";
import { db } from "@/db";
import { fxRate } from "@/db/schema";
import { sql } from "drizzle-orm";

// latest row per (fromCode,toCode)
export async function GET() {
  const rows = await db.execute(sql`
    SELECT f.from_code  AS "from",
           f.to_code    AS "to",
           CAST(f.rate AS FLOAT) AS rate,
           f.effective_date AS date
    FROM fx_rate f
    JOIN (
      SELECT from_code, to_code, MAX(effective_date) AS max_date
      FROM fx_rate
      GROUP BY from_code, to_code
    ) latest
      ON latest.from_code = f.from_code
     AND latest.to_code   = f.to_code
     AND latest.max_date  = f.effective_date
    ORDER BY f.from_code, f.to_code;
  `);
  return NextResponse.json({ rows: rows.rows });
}