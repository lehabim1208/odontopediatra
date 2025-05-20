using System;
using System.Data;
using MySql.Data.MySqlClient;
using DPFP;
using DPFP.Capture;

class Program : DPFP.Capture.EventHandler
{
    static string connStr = "server=localhost;user=root;password=wVzd427U*vPCmhd;database=odontopediatra";
    static MySqlConnection conn = new MySqlConnection(connStr);
    static Capture Capturer;
    static DPFP.Template Template;
    static DPFP.Processing.Enrollment enrollment = new DPFP.Processing.Enrollment(1); // Solo 1 muestra
    static bool captured = false;
    static byte[] lastTemplate = null;

    static void Main()
    {
        Console.WriteLine("Iniciando Fingerprint Worker...");
        conn.Open();
        while (true)
        {
            var task = GetPendingTask();
            if (task != null)
            {
                Console.WriteLine("Tarea encontrada: " + task["id"]);
                captured = false;
                lastTemplate = null;
                enrollment = new DPFP.Processing.Enrollment(1); // Solo 1 muestra
                StartCapture();
                Console.WriteLine("Coloca el dedo en el lector...");
                while (!captured)
                {
                    System.Threading.Thread.Sleep(500);
                }
                StopCapture();
                SaveFingerprint((int)task["id_tutor"], lastTemplate);
                MarkTaskCompleted((int)task["id"]);
                Console.WriteLine("Huella registrada y tarea completada.");
            }
            else
            {
                Console.WriteLine("Sin tareas pendientes. Esperando...");
                System.Threading.Thread.Sleep(2000);
            }
        }
    }

    static DataRow GetPendingTask()
    {
        var da = new MySqlDataAdapter("SELECT * FROM tareas_huella WHERE estado='pendiente' ORDER BY id ASC LIMIT 1", conn);
        var dt = new DataTable();
        da.Fill(dt);
        return dt.Rows.Count > 0 ? dt.Rows[0] : null;
    }

    static void MarkTaskCompleted(int taskId)
    {
        var cmd = new MySqlCommand("UPDATE tareas_huella SET estado='completado', fecha_actualizacion=NOW() WHERE id=@id", conn);
        cmd.Parameters.AddWithValue("@id", taskId);
        cmd.ExecuteNonQuery();
    }

    static void SaveFingerprint(int idTutor, byte[] template)
    {
        var cmd = new MySqlCommand("INSERT INTO huellas (tutor_id, template) VALUES (@tutor_id, @template)", conn);
        cmd.Parameters.AddWithValue("@tutor_id", idTutor);
        cmd.Parameters.AddWithValue("@template", template);
        cmd.ExecuteNonQuery();
    }

    public static void StartCapture()
    {
        Capturer = new Capture();
        Capturer.EventHandler = new Program();
        Capturer.StartCapture();
    }

    public static void StopCapture()
    {
        if (Capturer != null)
        {
            Capturer.StopCapture();
            Capturer = null;
        }
    }

    // DPFP.Capture.EventHandler implementation
    public void OnComplete(object Capture, string ReaderSerialNumber, DPFP.Sample Sample)
    {
        Console.WriteLine("Huella capturada.");
        var features = ExtractFeatures(Sample, DPFP.Processing.DataPurpose.Enrollment);
        if (features != null)
        {
            Console.WriteLine("Features extraídos correctamente.");
            enrollment.AddFeatures(features);
            Console.WriteLine("Muestras necesarias restantes: " + enrollment.FeaturesNeeded);
            Console.WriteLine("Estado del enrolamiento: " + enrollment.TemplateStatus);
            // Forzar guardado si hay al menos una muestra
            if (enrollment.TemplateStatus == DPFP.Processing.Enrollment.Status.Ready || enrollment.FeaturesNeeded <= 0)
            {
                Console.WriteLine("Template listo o forzado. Guardando en base de datos...");
                Template = enrollment.Template;
                if (Template != null && Template.Bytes != null)
                {
                    Console.WriteLine("Tamaño del template: " + Template.Bytes.Length);
                    try
                    {
                        lastTemplate = Template.Bytes;
                        captured = true;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error al guardar template: " + ex.Message);
                    }
                }
                else
                {
                    Console.WriteLine("Template es null o vacío. No se guardará en BD.");
                }
            }
            else if (enrollment.TemplateStatus == DPFP.Processing.Enrollment.Status.Failed)
            {
                Console.WriteLine("Enrolamiento fallido. Reiniciando enrolamiento...");
                enrollment = new DPFP.Processing.Enrollment(1);
            }
        }
        else
        {
            Console.WriteLine("No se pudieron extraer features de la muestra.");
        }
    }
    public void OnFingerGone(object Capture, string ReaderSerialNumber) { }
    public void OnFingerTouch(object Capture, string ReaderSerialNumber) { }
    public void OnReaderConnect(object Capture, string ReaderSerialNumber) { }
    public void OnReaderDisconnect(object Capture, string ReaderSerialNumber) { }
    public void OnSampleQuality(object Capture, string ReaderSerialNumber, DPFP.Capture.CaptureFeedback CaptureFeedback) { }

    private DPFP.FeatureSet ExtractFeatures(DPFP.Sample Sample, DPFP.Processing.DataPurpose Purpose)
    {
        var extractor = new DPFP.Processing.FeatureExtraction();
        DPFP.Capture.CaptureFeedback feedback = DPFP.Capture.CaptureFeedback.None;
        var features = new DPFP.FeatureSet();
        extractor.CreateFeatureSet(Sample, Purpose, ref feedback, ref features);
        Console.WriteLine("Feedback de la muestra: " + feedback);
        return (feedback == DPFP.Capture.CaptureFeedback.Good) ? features : null;
    }
}