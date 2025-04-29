const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function main() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "wVzd427U*vPCmhd",
    database: "odontopediatra", 
  });

  const users = [
    { nombre: "Administrador", usuario: "admin", correo: "admin@correo.com", password: "admin", rol: "doctor" },
    { nombre: "Marcela", usuario: "marcela", correo: "marcela@correo.com", password: "marcela", rol: "secretary" },
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    await db.query(
      "INSERT IGNORE INTO usuarios (nombre, usuario, correo, password, rol) VALUES (?, ?, ?, ?, ?)",
      [user.nombre, user.usuario, user.correo, hash, user.rol]
    );
  }

  await db.end();
  console.log("Usuarios insertados correctamente.");
}

main();