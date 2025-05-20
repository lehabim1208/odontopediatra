using System;
using System.Data;
using System.Threading;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using DPFP;
using DPFP.Capture;

public class FingerprintForm : Form, DPFP.Capture.EventHandler
{
    Button btnStart, btnStop;
    TextBox txtLog;
    Thread workerThread;
    bool running = false;
    Capture Capturer;
    DPFP.Template Template;
    DPFP.Processing.Enrollment enrollment;
    bool captured = false;
    byte[] lastTemplate = null;
    MySqlConnection conn;
    string connStr = "server=localhost;user=root;password=wVzd427U*vPCmhd;database=odontopediatra";

    public FingerprintForm()
    {
        Text = "Fingerprint Worker";
        Width = 600;
        Height = 400;

        btnStart = new Button { Text = "Iniciar", Left = 20, Top = 20, Width = 100 };
        btnStop = new Button { Text = "Detener", Left = 140, Top = 20, Width = 100, Enabled = false };
        txtLog = new TextBox { Left = 20, Top = 60, Width = 540, Height = 280, Multiline = true, ScrollBars = ScrollBars.Vertical, ReadOnly = true };

        btnStart.Click += (s, e) => StartWorker();
        btnStop.Click += (s, e) => StopWorker();

        Controls.Add(btnStart);
        Controls.Add(btnStop);
        Controls.Add(txtLog);
    }

    void StartWorker()
    {
        running = true;
        btnStart.Enabled = false;
        btnStop.Enabled = true;
        workerThread = new Thread(WorkerLoop) { IsBackground = true };
        workerThread.Start();
        Log("Iniciando captura");
    }

    void StopWorker()
    {
        running = false;
        btnStart.Enabled = true;
        btnStop.Enabled = false;
        if (workerThread != null && workerThread.IsAlive)
            workerThread.Join();
        Log("Servicio detenido.");
    }

    void WorkerLoop()
    {
        try
        {
            conn = new MySqlConnection(connStr);
            conn.Open();
            while (running)
            {
                try
                {
                    var task = GetPendingTask();
                    if (task != null)
                    {
                        Log("Tarea encontrada: " + task["id"]);
                        captured = false;
                        lastTemplate = null;
                        enrollment = new DPFP.Processing.Enrollment(); // Default: requiere 4 muestras
                        StartCapture();
                        Log("Coloca el dedo en el lector 4 veces (diferentes posiciones/ángulos)...");
                        while (!captured && running)
                        {
                            Thread.Sleep(500);
                        }
                        StopCapture();
                        if (lastTemplate != null)
                        {
                            Log("Guardando en base de datos...");
                            SaveFingerprint((int)task["id_tutor"], task["dedo"].ToString(), lastTemplate);
                            MarkTaskCompleted((int)task["id"]);
                            Log("Huella registrada y tarea completada.");
                        }
                    }
                    else
                    {
                        Thread.Sleep(2000);
                    }
                }
                catch (Exception ex)
                {
                    Log("Error en ciclo de trabajo: " + ex.Message);
                }
            }
            conn.Close();
        }
        catch (Exception ex)
        {
            Log("Error de conexión o general: " + ex.Message);
        }
    }

    DataRow GetPendingTask()
    {
        var da = new MySqlDataAdapter("SELECT * FROM tareas_huella WHERE estado='pendiente' ORDER BY id ASC LIMIT 1", conn);
        var dt = new DataTable();
        da.Fill(dt);
        return dt.Rows.Count > 0 ? dt.Rows[0] : null;
    }

    void MarkTaskCompleted(int taskId)
    {
        var cmd = new MySqlCommand("UPDATE tareas_huella SET estado='completado' WHERE id=@id", conn);
        cmd.Parameters.AddWithValue("@id", taskId);
        cmd.ExecuteNonQuery();
    }

    void SaveFingerprint(int tutorId, string dedo, byte[] template)
    {
        var cmd = new MySqlCommand("INSERT INTO huellas (tutor_id, dedo, template) VALUES (@tutor_id, @dedo, @template)", conn);
        cmd.Parameters.AddWithValue("@tutor_id", tutorId);
        cmd.Parameters.AddWithValue("@dedo", dedo);
        cmd.Parameters.AddWithValue("@template", template);
        cmd.ExecuteNonQuery();
    }

    public void StartCapture()
    {
        Capturer = new Capture();
        Capturer.EventHandler = this;
        Capturer.StartCapture();
    }

    public void StopCapture()
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
        try
        {
            Log("Huella capturada.");
            Log("________________________________________");
            var features = ExtractFeatures(Sample, DPFP.Processing.DataPurpose.Enrollment);
            if (features != null)
            {
                enrollment.AddFeatures(features);
                if (enrollment.TemplateStatus == DPFP.Processing.Enrollment.Status.Ready || enrollment.FeaturesNeeded <= 0)
                {
                    Template = enrollment.Template;
                    if (Template != null && Template.Bytes != null)
                    {
                        lastTemplate = Template.Bytes;
                        captured = true;
                    }
                }
                else if (enrollment.TemplateStatus == DPFP.Processing.Enrollment.Status.Failed)
                {
                    enrollment = new DPFP.Processing.Enrollment();
                }
                else
                {
                    if (enrollment.FeaturesNeeded > 0)
                    {
                        Log("Muestras necesarias restantes: " + enrollment.FeaturesNeeded + " - Coloca nuevamente el dedo");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Log("Error en captura de huella: " + ex.Message);
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
        return (feedback == DPFP.Capture.CaptureFeedback.Good) ? features : null;
    }

    void Log(string message)
    {
        if (InvokeRequired)
            Invoke(new Action<string>(Log), message);
        else
            txtLog.AppendText(DateTime.Now.ToString("HH:mm:ss") + " - " + message + Environment.NewLine);
    }

    [STAThread]
    public static void Main()
    {
        Application.EnableVisualStyles();
        Application.Run(new FingerprintForm());
    }
}