Comando CMD para compilar el programa desktop en c#:
csc /t:winexe /r:MySql.Data.dll /r:DPFPDevNET.dll /r:DPFPEngNET.dll /r:DPFPGuiNET.dll /r:DPFPVerNET.dll /r:DPFPShrNET.dll /r:DPFPCtlXTypeLibNET.dll /r:DPFPCtlXWrapperNET.dll /r:DPFPShrXTypeLibNET.dll FingerprintWorkerWinForms.cs


Comando SQL para resetear las tablas:
USE odontopediatra;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tutores;
TRUNCATE TABLE paciente_tutor;
TRUNCATE TABLE huellas;
TRUNCATE TABLE tareas_huella;
SET FOREIGN_KEY_CHECKS = 1;

Comando SQL para resetear las tablas tratamientos:
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tratamientos;
TRUNCATE TABLE detalle_tratamientos;
SET FOREIGN_KEY_CHECKS = 1;
