// lib/db.ts
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "wVzd427U*vPCmhd",
  database: "odontopediatra", 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});