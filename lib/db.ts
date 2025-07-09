// lib/db.ts
import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "wVzd427U*vPCmhd",
  database: "odontopediatra",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Supabase remoto para validar licencia
export const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);