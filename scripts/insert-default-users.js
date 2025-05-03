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

async function fixAdminPermissions() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "wVzd427U*vPCmhd",
    database: "odontopediatra",
  });
  // Obtener permisos actuales del admin
  const [rows] = await db.query("SELECT id, permisos FROM usuarios WHERE id = 1");
  if (rows.length === 0) {
    console.log("No existe usuario admin con id=1");
    await db.end();
    return;
  }
  let permisos = {};
  try {
    permisos = rows[0].permisos ? JSON.parse(rows[0].permisos) : {};
  } catch {
    permisos = {};
  }
  permisos.usuarios = true;
  // Puedes agregar otros permisos si quieres asegurarlos
  await db.query("UPDATE usuarios SET permisos=? WHERE id=1", [JSON.stringify(permisos)]);
  await db.end();
  console.log("Permisos del admin actualizados:", permisos);
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  fixAdminPermissions();
}

main();