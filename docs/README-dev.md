Comando CMD para compilar el programa desktop en c#:
csc /t:winexe /r:MySql.Data.dll /r:DPFPDevNET.dll /r:DPFPEngNET.dll /r:DPFPGuiNET.dll /r:DPFPVerNET.dll /r:DPFPShrNET.dll /r:DPFPCtlXTypeLibNET.dll /r:DPFPCtlXWrapperNET.dll /r:DPFPShrXTypeLibNET.dll FingerprintWorkerWinForms.cs


Comando SQL para resetear las tablas:
USE odontopediatra;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tutores;
TRUNCATE TABLE paciente_tutor;
TRUNCATE TABLE huellas;
TRUNCATE TABLE tareas_huella;
TRUNCATE TABLE tratamientos;
TRUNCATE TABLE detalle_tratamientos;
SET FOREIGN_KEY_CHECKS = 1;



NOTAS LEHABIM: 

PENDIENTES

En la página de citas, quiero que al darle clic en algun espacio de la cuadrícula se pueda crear una nueva cita (que sea clickeable cada uno de los espacios vacíos en blanco, no los de comida), que abra el modal "Nueva cita" pero ya con el horario al que le di clic en la cuadricula. Al estilo de google calendar. No elimines ninguna linea de código importante.
El hover al pasar por los espacios vacíos debe ser color azul claro tanto modo claro y modo oscuro.
Me refiero a todos esos espacios de 15 minutos, solo los que están vacíos.


La cuadrícula de la página de "Citas", los espacios vacíos deben ser clickeables y al dar click debe abrir el modal de "Crear cita" con el horario y día del espacio seleccionado o clickeado. Al estilo de "Google calendar" 


Arreglar que se cargue el sidebar y las cards despues de obtener los permisos, ya que al iniciar sesión con la secretaria que tiene permisos a ciertas páginas, en la pagina de inicio y en el sidebar me aparece como sino tuviera permisos de nada. Pero le doy recargar a la página y ya carga las páginas a las que tiene permiso.