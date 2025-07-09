CREATE DATABASE  IF NOT EXISTS `odontopediatra` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `odontopediatra`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: odontopediatra
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `archivos`
--

DROP TABLE IF EXISTS `archivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivos` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `tamano` int NOT NULL,
  `url` text COLLATE utf8mb4_general_ci NOT NULL,
  `etiqueta` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_subida` datetime NOT NULL,
  `id_paciente` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `archivos_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archivos`
--

LOCK TABLES `archivos` WRITE;
/*!40000 ALTER TABLE `archivos` DISABLE KEYS */;
/*!40000 ALTER TABLE `archivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `paciente_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `duracion` varchar(50) DEFAULT NULL,
  `notas` text,
  `estado` varchar(50) DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultorio`
--

DROP TABLE IF EXISTS `consultorio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultorio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text,
  `logo_ruta` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultorio`
--

LOCK TABLES `consultorio` WRITE;
/*!40000 ALTER TABLE `consultorio` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultorio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_tratamientos`
--

DROP TABLE IF EXISTS `detalle_tratamientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_tratamientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_tratamiento` int DEFAULT NULL,
  `organo_dentario` text,
  `tratamiento_convencional` text,
  `tratamiento_recomendado` text,
  `precio_convencional` decimal(10,2) DEFAULT NULL,
  `precio_recomendado` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tratamiento` (`id_tratamiento`),
  CONSTRAINT `fk_tratamiento` FOREIGN KEY (`id_tratamiento`) REFERENCES `tratamientos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_tratamientos`
--

LOCK TABLES `detalle_tratamientos` WRITE;
/*!40000 ALTER TABLE `detalle_tratamientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_tratamientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed01_ficha_identificacion`
--

DROP TABLE IF EXISTS `hismed01_ficha_identificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed01_ficha_identificacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `edad` int DEFAULT NULL,
  `sexo` varchar(50) DEFAULT NULL,
  `nacionalidad` varchar(100) DEFAULT NULL,
  `estado_civil` varchar(50) DEFAULT NULL,
  `ocupacion` varchar(100) DEFAULT NULL,
  `medico` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `lugar_origen` varchar(255) DEFAULT NULL,
  `lugar_residencia` varchar(255) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `domicilio` varchar(255) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `emergencia` varchar(255) DEFAULT NULL,
  `talla_peso_nacimiento` varchar(100) DEFAULT NULL,
  `tipo_parto` varchar(100) DEFAULT NULL,
  `padre_tutor` varchar(255) DEFAULT NULL,
  `ultimo_examen_dental` date DEFAULT NULL,
  `motivo_consulta` varchar(255) DEFAULT NULL,
  `interes_tratamiento` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed01_ficha_identificacion_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed01_ficha_identificacion`
--

LOCK TABLES `hismed01_ficha_identificacion` WRITE;
/*!40000 ALTER TABLE `hismed01_ficha_identificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed01_ficha_identificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed02_heredo_familiares`
--

DROP TABLE IF EXISTS `hismed02_heredo_familiares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed02_heredo_familiares` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `abuelo_paterno` varchar(100) DEFAULT NULL,
  `abuela_paterna` varchar(100) DEFAULT NULL,
  `abuelo_materno` varchar(100) DEFAULT NULL,
  `abuela_materna` varchar(100) DEFAULT NULL,
  `madre` varchar(100) DEFAULT NULL,
  `padre` varchar(100) DEFAULT NULL,
  `otros_familiares` varchar(255) DEFAULT NULL,
  `no_sabe` tinyint(1) DEFAULT NULL,
  `tuberculosis` tinyint(1) DEFAULT NULL,
  `diabetes` tinyint(1) DEFAULT NULL,
  `hipertension` tinyint(1) DEFAULT NULL,
  `carcinomas` tinyint(1) DEFAULT NULL,
  `cardiopatias` tinyint(1) DEFAULT NULL,
  `hepatitis` tinyint(1) DEFAULT NULL,
  `nefropatias` tinyint(1) DEFAULT NULL,
  `endocrinas` tinyint(1) DEFAULT NULL,
  `mentales` tinyint(1) DEFAULT NULL,
  `epilepsia` tinyint(1) DEFAULT NULL,
  `asma` tinyint(1) DEFAULT NULL,
  `hematologicas` tinyint(1) DEFAULT NULL,
  `sifilis` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed02_heredo_familiares_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed02_heredo_familiares`
--

LOCK TABLES `hismed02_heredo_familiares` WRITE;
/*!40000 ALTER TABLE `hismed02_heredo_familiares` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed02_heredo_familiares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed03_no_patogenos`
--

DROP TABLE IF EXISTS `hismed03_no_patogenos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed03_no_patogenos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `cepillo` varchar(100) DEFAULT NULL,
  `habitacion` varchar(100) DEFAULT NULL,
  `tabaquismo` tinyint(1) DEFAULT NULL,
  `alcoholismo` tinyint(1) DEFAULT NULL,
  `alimentacion` varchar(255) DEFAULT NULL,
  `inmunizaciones` varchar(255) DEFAULT NULL,
  `pasatiempos` varchar(255) DEFAULT NULL,
  `vida_sexual` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed03_no_patogenos_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed03_no_patogenos`
--

LOCK TABLES `hismed03_no_patogenos` WRITE;
/*!40000 ALTER TABLE `hismed03_no_patogenos` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed03_no_patogenos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed04_padecimientos`
--

DROP TABLE IF EXISTS `hismed04_padecimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed04_padecimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `accidentes_cara` tinyint(1) DEFAULT NULL,
  `operaciones_cara` tinyint(1) DEFAULT NULL,
  `alergias` tinyint(1) DEFAULT NULL,
  `problemas_oido` tinyint(1) DEFAULT NULL,
  `problemas_nacimiento` tinyint(1) DEFAULT NULL,
  `problemas_sangrado` tinyint(1) DEFAULT NULL,
  `problemas_lenguaje` tinyint(1) DEFAULT NULL,
  `problemas_respiracion` tinyint(1) DEFAULT NULL,
  `padecimiento_asma` tinyint(1) DEFAULT NULL,
  `anemia` tinyint(1) DEFAULT NULL,
  `problemas_amigdalas` tinyint(1) DEFAULT NULL,
  `padecimiento_diabetes` tinyint(1) DEFAULT NULL,
  `padecimiento_epilepsia` tinyint(1) DEFAULT NULL,
  `fiebre_reumatica` tinyint(1) DEFAULT NULL,
  `enfermedades_corazon` tinyint(1) DEFAULT NULL,
  `operacion_amigdalas` tinyint(1) DEFAULT NULL,
  `dificultad_masticar` tinyint(1) DEFAULT NULL,
  `ronca_dormir` tinyint(1) DEFAULT NULL,
  `respira_boca` tinyint(1) DEFAULT NULL,
  `chupa_dedo` tinyint(1) DEFAULT NULL,
  `muerde_labio` tinyint(1) DEFAULT NULL,
  `muerde_unas` tinyint(1) DEFAULT NULL,
  `rechina_dientes` tinyint(1) DEFAULT NULL,
  `enfermedades_transmision_sexual` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed04_padecimientos_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed04_padecimientos`
--

LOCK TABLES `hismed04_padecimientos` WRITE;
/*!40000 ALTER TABLE `hismed04_padecimientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed04_padecimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed05_preguntas`
--

DROP TABLE IF EXISTS `hismed05_preguntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed05_preguntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `consulta_ortodoncia` tinyint(1) DEFAULT NULL,
  `cuando_ortodoncia` varchar(100) DEFAULT NULL,
  `porque_ortodoncia` varchar(255) DEFAULT NULL,
  `resultado_ortodoncia` varchar(255) DEFAULT NULL,
  `problema_mordida` tinyint(1) DEFAULT NULL,
  `comentarios_problema` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed05_preguntas_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed05_preguntas`
--

LOCK TABLES `hismed05_preguntas` WRITE;
/*!40000 ALTER TABLE `hismed05_preguntas` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed05_preguntas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed06_aparatos_y_sistemas`
--

DROP TABLE IF EXISTS `hismed06_aparatos_y_sistemas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed06_aparatos_y_sistemas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `aparato_digestivo` varchar(255) DEFAULT NULL,
  `aparato_cardiovascular` varchar(255) DEFAULT NULL,
  `aparato_respiratorio` varchar(255) DEFAULT NULL,
  `aparato_genito_urinario` varchar(255) DEFAULT NULL,
  `sistema_endocrino` varchar(255) DEFAULT NULL,
  `sistema_nervioso` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed06_aparatos_y_sistemas_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed06_aparatos_y_sistemas`
--

LOCK TABLES `hismed06_aparatos_y_sistemas` WRITE;
/*!40000 ALTER TABLE `hismed06_aparatos_y_sistemas` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed06_aparatos_y_sistemas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed07_exploracion_general`
--

DROP TABLE IF EXISTS `hismed07_exploracion_general`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed07_exploracion_general` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `exg_presion_arterial` varchar(50) DEFAULT NULL,
  `exg_frecuencia_respiratoria` varchar(50) DEFAULT NULL,
  `exg_pulso` varchar(50) DEFAULT NULL,
  `exg_temperatura` varchar(50) DEFAULT NULL,
  `exg_peso_actual` varchar(50) DEFAULT NULL,
  `exg_talla` varchar(50) DEFAULT NULL,
  `exg_cabeza` varchar(255) DEFAULT NULL,
  `exg_cuello` varchar(255) DEFAULT NULL,
  `exg_higiene` varchar(255) DEFAULT NULL,
  `exg_periodonto` varchar(255) DEFAULT NULL,
  `exg_prevalencia_caries` varchar(255) DEFAULT NULL,
  `exg_denticion` varchar(255) DEFAULT NULL,
  `exg_dientes_faltantes` varchar(255) DEFAULT NULL,
  `exg_dientes_retenidos` varchar(255) DEFAULT NULL,
  `exg_dientes_impactados` varchar(255) DEFAULT NULL,
  `exg_descalcificacion_dientes` varchar(255) DEFAULT NULL,
  `exg_insercion_frenillos` varchar(255) DEFAULT NULL,
  `exg_labios` varchar(255) DEFAULT NULL,
  `exg_proporcion_lengua_arcos` varchar(255) DEFAULT NULL,
  `exg_problemas_lenguaje` varchar(255) DEFAULT NULL,
  `exg_terceros_molares` varchar(255) DEFAULT NULL,
  `exg_habitos` varchar(255) DEFAULT NULL,
  `exg_tipo_perfil` varchar(255) DEFAULT NULL,
  `exg_tipo_craneo` varchar(255) DEFAULT NULL,
  `exg_tipo_cara` varchar(255) DEFAULT NULL,
  `exg_forma_arcadas_dentarias` varchar(255) DEFAULT NULL,
  `exg_forma_paladar` varchar(255) DEFAULT NULL,
  `exg_observaciones_especiales` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed07_exploracion_general_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed07_exploracion_general`
--

LOCK TABLES `hismed07_exploracion_general` WRITE;
/*!40000 ALTER TABLE `hismed07_exploracion_general` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed07_exploracion_general` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed08_examenes`
--

DROP TABLE IF EXISTS `hismed08_examenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed08_examenes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `exm_tipo_denticion` varchar(100) DEFAULT NULL,
  `exm_relacion_molar_clase` varchar(50) DEFAULT NULL,
  `exm_relacion_molar_derecho` varchar(50) DEFAULT NULL,
  `exm_relacion_molar_izquierdo` varchar(50) DEFAULT NULL,
  `exm_relacion_canina_clase` varchar(50) DEFAULT NULL,
  `exm_relacion_canina_derecho` varchar(50) DEFAULT NULL,
  `exm_relacion_canina_izquierdo` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_recto_derecho` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_recto_izquierdo` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_mesial_derecho` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_mesial_izquierdo` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_distal_derecho` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_distal_izquierdo` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_mesian_exagerado_derecho` varchar(50) DEFAULT NULL,
  `exm_plano_terminal_mesian_exagerado_izquierdo` varchar(50) DEFAULT NULL,
  `exm_espaciada_arco_maxilar` varchar(50) DEFAULT NULL,
  `exm_espaciada_arco_mandibular` varchar(50) DEFAULT NULL,
  `exm_cerrada_arco_maxilar` varchar(50) DEFAULT NULL,
  `exm_cerrada_arco_mandibular` varchar(50) DEFAULT NULL,
  `exm_clasificacion_angle` varchar(100) DEFAULT NULL,
  `exm_mordida_cruzada` varchar(100) DEFAULT NULL,
  `exm_linea_media_dentaria_mandibular` varchar(100) DEFAULT NULL,
  `exm_linea_media_dentaria_maxilar` varchar(100) DEFAULT NULL,
  `exm_rotaciones` varchar(100) DEFAULT NULL,
  `exm_apianamiento` varchar(100) DEFAULT NULL,
  `exm_espacios` varchar(100) DEFAULT NULL,
  `exm_over_jet` varchar(100) DEFAULT NULL,
  `exm_over_bite` varchar(100) DEFAULT NULL,
  `exm_sintomatologia_atm` varchar(100) DEFAULT NULL,
  `exm_interferencias_oclusales` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed08_examenes_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed08_examenes`
--

LOCK TABLES `hismed08_examenes` WRITE;
/*!40000 ALTER TABLE `hismed08_examenes` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed08_examenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hismed09_diagnostico`
--

DROP TABLE IF EXISTS `hismed09_diagnostico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hismed09_diagnostico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `diag_examenes_laboratorio` text,
  `diag_estudios_gabinete` text,
  `diag_diagnostico` text,
  `diag_pronostico` text,
  `diag_plan_tratamiento` text,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `hismed09_diagnostico_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hismed09_diagnostico`
--

LOCK TABLES `hismed09_diagnostico` WRITE;
/*!40000 ALTER TABLE `hismed09_diagnostico` DISABLE KEYS */;
/*!40000 ALTER TABLE `hismed09_diagnostico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `huellas`
--

DROP TABLE IF EXISTS `huellas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `huellas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tutor_id` int NOT NULL,
  `dedo` varchar(50) DEFAULT NULL,
  `template` blob NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tutor_id` (`tutor_id`),
  CONSTRAINT `huellas_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `huellas`
--

LOCK TABLES `huellas` WRITE;
/*!40000 ALTER TABLE `huellas` DISABLE KEYS */;
/*!40000 ALTER TABLE `huellas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `odontograma`
--

DROP TABLE IF EXISTS `odontograma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `odontograma` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int NOT NULL,
  `fecha_hora` datetime DEFAULT NULL,
  `notas` text,
  `json_vector` json DEFAULT NULL,
  `historial_cambios` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `odontograma_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `odontograma`
--

LOCK TABLES `odontograma` WRITE;
/*!40000 ALTER TABLE `odontograma` DISABLE KEYS */;
/*!40000 ALTER TABLE `odontograma` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paciente_tutor`
--

DROP TABLE IF EXISTS `paciente_tutor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paciente_tutor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `paciente_id` int NOT NULL,
  `tutor_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  KEY `tutor_id` (`tutor_id`),
  CONSTRAINT `paciente_tutor_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  CONSTRAINT `paciente_tutor_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paciente_tutor`
--

LOCK TABLES `paciente_tutor` WRITE;
/*!40000 ALTER TABLE `paciente_tutor` DISABLE KEYS */;
/*!40000 ALTER TABLE `paciente_tutor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pacientes`
--

DROP TABLE IF EXISTS `pacientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pacientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `nombre_tutor` varchar(255) DEFAULT NULL,
  `edad` int DEFAULT NULL,
  `ultima_visita` datetime DEFAULT NULL,
  `sexo` varchar(50) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `telefono_secundario` varchar(20) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_doctor` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_doctor` (`id_doctor`),
  CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`id_doctor`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pacientes`
--

LOCK TABLES `pacientes` WRITE;
/*!40000 ALTER TABLE `pacientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `pacientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas_huella`
--

DROP TABLE IF EXISTS `tareas_huella`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas_huella` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_tutor` int DEFAULT NULL,
  `tipo` enum('registro','comparacion') NOT NULL,
  `dedo` varchar(50) DEFAULT NULL,
  `estado` enum('pendiente','procesando','completado','fallido') DEFAULT 'pendiente',
  `resultado` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT NULL,
  `id_tratamiento` int DEFAULT NULL,
  `tratamiento_aprobado` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_tutor` (`id_tutor`),
  CONSTRAINT `tareas_huella_ibfk_1` FOREIGN KEY (`id_tutor`) REFERENCES `tutores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas_huella`
--

LOCK TABLES `tareas_huella` WRITE;
/*!40000 ALTER TABLE `tareas_huella` DISABLE KEYS */;
/*!40000 ALTER TABLE `tareas_huella` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tratamientos`
--

DROP TABLE IF EXISTS `tratamientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tratamientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_paciente` int DEFAULT NULL,
  `aprobacion` varchar(255) DEFAULT NULL,
  `estado` varchar(20) NOT NULL,
  `fecha_aprobado` date DEFAULT NULL,
  `aprobado_por_idtutor` int DEFAULT NULL,
  `total_convencional` decimal(10,2) DEFAULT NULL,
  `total_recomendado` decimal(10,2) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tratamiento_aprobado` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_paciente` (`id_paciente`),
  KEY `fk_aprobado_por` (`aprobado_por_idtutor`),
  CONSTRAINT `fk_aprobado_por` FOREIGN KEY (`aprobado_por_idtutor`) REFERENCES `tutores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tratamientos`
--

LOCK TABLES `tratamientos` WRITE;
/*!40000 ALTER TABLE `tratamientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `tratamientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutores`
--

DROP TABLE IF EXISTS `tutores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `relacion` varchar(50) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutores`
--

LOCK TABLES `tutores` WRITE;
/*!40000 ALTER TABLE `tutores` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `permisos` text,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE licencias (
  id INT PRIMARY KEY,
  accion INT DEFAULT 0
);

INSERT INTO licencias (id, accion) VALUES (1, 0);
--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Emmanuel','admin','emmanuel@gmail.com','$2b$10$t4.GId/O.pm1L7KJtqQYn.w.Y65ZPZ.d4xxPKnH1vPAcbKynRcF1a','doctor','{\n  \"pacientes\": true,\n  \"citas\": true,\n  \"odontograma\": true,\n  \"radiografias\": true,\n  \"usuarios\": true,\n  \"configuracion\": true,\n  \"clinic\": true\n}','2025-04-28 22:21:12'),(2,'Marcela','marcela','marcela@gmail.com','$2b$10$8S7j2DOLomi4uS1pCNx1gOLTe1LvaQBimpQiCj7xFCYjf53bFOrv6','secretary','{\"pacientes\":true,\"citas\":true,\"odontograma\":false,\"radiografias\":false,\"usuarios\":false,\"configuracion\":true,\"clinic\":false}','2025-04-28 22:21:13');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dump completed on 2025-07-08  2:11:48