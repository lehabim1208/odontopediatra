using System;
using System.Data;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using DPFP;
using DPFP.Capture;

// Nueva pantalla principal moderna y guiada
public class MainForm : Form, DPFP.Capture.EventHandler
{
    private PictureBox logoBox;
    private PictureBox fingerprintBox;
    private Label taskLabel;
    private Label infoLabel;
    private Button startButton;
    private Button stopButton;
    private Button approveButton; // NUEVO
    private string connStr = "server=localhost;user=root;password=wVzd427U*vPCmhd;database=odontopediatra";
    private Capture Capturer;
    private DPFP.Template Template;
    private DPFP.Processing.Enrollment enrollment;
    private bool captured = false;
    private byte[] lastTemplate = null;
    private DPFP.Sample lastSample = null; // Cambia esto: Guarda el último Sample capturado
    private Thread workerThread;
    private bool running = false;

    public MainForm()
    {
        Text = "Lector de huellas EmmanuelSeverino";
        Width = 400;
        Height = 600;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;

        try
        {
            logoBox = new PictureBox
            {
                Image = Image.FromFile("logo-emmanuel-severino.png"),
                SizeMode = PictureBoxSizeMode.Zoom,
                Size = new Size(80, 80),
                Location = new Point((this.ClientSize.Width - 80) / 2, 20)
            };
            Controls.Add(logoBox);
        }
        catch (Exception ex)
        {
            MessageBox.Show("No se pudo cargar el logo: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        try
        {
            fingerprintBox = new PictureBox
            {
                Image = Image.FromFile("fingerprint.png"), // Convierte a PNG si es necesario
                SizeMode = PictureBoxSizeMode.Zoom,
                Size = new Size(120, 120),
                Location = new Point((this.ClientSize.Width - 120) / 2, 110)
            };
            Controls.Add(fingerprintBox);
        }
        catch (Exception ex)
        {
            MessageBox.Show("No se pudo cargar la imagen de huella: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        taskLabel = new Label
        {
            Text = "",
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            ForeColor = Color.DarkGreen,
            AutoSize = false,
            TextAlign = ContentAlignment.MiddleCenter,
            Size = new Size(this.ClientSize.Width, 30),
            Location = new Point(0, 240)
        };
        Controls.Add(taskLabel);

        infoLabel = new Label
        {
            Text = "Presione 'Iniciar' para buscar una tarea de huella.",
            Font = new Font("Segoe UI", 11),
            AutoSize = false,
            TextAlign = ContentAlignment.MiddleCenter,
            Size = new Size(this.ClientSize.Width, 60),
            Location = new Point(0, 280)
        };
        Controls.Add(infoLabel);

        startButton = new Button
        {
            Text = "Registrar huella",
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            Size = new Size(200, 50),
            Location = new Point((this.ClientSize.Width - 200) / 2, 360)
        };
        startButton.Click += StartButton_Click;
        Controls.Add(startButton);

        stopButton = new Button
        {
            Text = "Detener",
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            Size = new Size(200, 50),
            Location = new Point((this.ClientSize.Width - 200) / 2, 420),
            Visible = false,
            Enabled = false
        };
        stopButton.Click += StopButton_Click;
        Controls.Add(stopButton);

        approveButton = new Button
        {
            Text = "Aprobar tratamiento",
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            Size = new Size(200, 50),
            Location = new Point((this.ClientSize.Width - 200) / 2, 490)
        };
        approveButton.Click += ApproveButton_Click;
        Controls.Add(approveButton);
    }

    private void StartButton_Click(object sender, EventArgs e)
    {
        running = true;
        startButton.Enabled = false;
        startButton.Visible = false;
        approveButton.Visible = false;
        stopButton.Visible = true;
        stopButton.Enabled = true;
        infoLabel.Text = "Iniciando captura";
        taskLabel.Text = "";
        workerThread = new Thread(WorkerLoop) { IsBackground = true };
        workerThread.Start();
    }

    private void StopButton_Click(object sender, EventArgs e)
    {
        running = false;
        startButton.Enabled = true;
        startButton.Visible = true;
        approveButton.Visible = true;
        stopButton.Enabled = false;
        stopButton.Visible = false;
        if (workerThread != null && workerThread.IsAlive)
            workerThread.Join();
        infoLabel.Text = "Servicio detenido.";
    }

    private void WorkerLoop()
    {
        try
        {
            using (var conn = new MySqlConnection(connStr))
            {
                conn.Open();
                var task = GetPendingTask(conn);
                if (task != null)
                {
                    Invoke(new Action(() => {
                        taskLabel.Text = "Tarea encontrada: " + task["id"];
                        infoLabel.Text = "Coloca el dedo en el lector 4 veces (diferentes posiciones/ángulos)...";
                    }));
                    captured = false;
                    lastTemplate = null;
                    enrollment = new DPFP.Processing.Enrollment();
                    StartCapture();
                    while (!captured && running)
                    {
                        Thread.Sleep(500);
                    }
                    StopCapture();
                    if (lastTemplate != null)
                    {
                        try
                        {
                            Invoke(new Action(() => infoLabel.Text = "Guardando en base de datos..."));
                            SaveFingerprint(conn, Convert.ToInt32(task["id_tutor"].ToString()), task["dedo"].ToString(), lastTemplate);
                            MarkTaskCompleted(conn, Convert.ToInt32(task["id"].ToString()));
                            Invoke(new Action(() => {
                                infoLabel.Text = "Huella registrada y tarea completada.";
                                MessageBox.Show("Huella registrada y tarea completada.", "Éxito", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                taskLabel.Text = "";
                                stopButton.Enabled = false;
                                stopButton.Visible = false;
                                startButton.Enabled = true;
                                startButton.Visible = true;
                                approveButton.Visible = true;
                                approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
                            }));
                            running = false;
                        }
                        catch (Exception ex)
                        {
                            Invoke(new Action(() => {
                                MessageBox.Show("Error al guardar en base de datos: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                startButton.Enabled = true;
                                startButton.Visible = true;
                                approveButton.Visible = true;
                                approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
                            }));
                        }
                    }
                }
                else
                {
                    Invoke(new Action(() => {
                        infoLabel.Text = "No hay tarea pendiente para registrar huella.";
                        MessageBox.Show("No hay tarea pendiente para registrar huella.", "Sin tarea pendiente", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        stopButton.Enabled = false;
                        stopButton.Visible = false;
                        startButton.Enabled = true;
                        startButton.Visible = true;
                        approveButton.Visible = true;
                        approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
                    }));
                    running = false;
                }
            }
        }
        catch (Exception ex)
        {
            Invoke(new Action(() => {
                infoLabel.Text = "Error de conexión o general: " + ex.Message;
                startButton.Enabled = true;
                startButton.Visible = true;
                approveButton.Visible = true;
                approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
            }));
        }
    }

    private DataRow GetPendingTask(MySqlConnection conn)
    {
        // Solo buscar tareas de tipo 'registro'
        var da = new MySqlDataAdapter("SELECT * FROM tareas_huella WHERE estado='pendiente' AND tipo='registro' ORDER BY id ASC LIMIT 1", conn);
        var dt = new DataTable();
        da.Fill(dt);
        return dt.Rows.Count > 0 ? dt.Rows[0] : null;
    }

    private void MarkTaskCompleted(MySqlConnection conn, int taskId)
    {
        var cmd = new MySqlCommand("UPDATE tareas_huella SET estado='completado' WHERE id=@id", conn);
        cmd.Parameters.AddWithValue("@id", taskId);
        cmd.ExecuteNonQuery();
    }

    private void SaveFingerprint(MySqlConnection conn, int tutorId, string dedo, byte[] template)
    {
        var cmd = new MySqlCommand("INSERT INTO huellas (tutor_id, dedo, template) VALUES (@tutor_id, @dedo, @template)", conn);
        cmd.Parameters.AddWithValue("@tutor_id", tutorId);
        cmd.Parameters.AddWithValue("@dedo", dedo);
        cmd.Parameters.AddWithValue("@template", template);
        cmd.ExecuteNonQuery();
    }

    private void StartCapture()
    {
        try
        {
            // Siempre detener captura previa si existe
            if (Capturer != null)
            {
                try { Capturer.StopCapture(); } catch { }
                Capturer = null;
            }
            Capturer = new Capture();
            Capturer.EventHandler = this;
            try
            {
                Capturer.StartCapture();
            }
            catch (Exception ex)
            {
                MessageBox.Show("No se pudo iniciar la captura. ¿El lector está conectado y libre?\n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                throw;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show("Error al iniciar la captura: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            throw;
        }
    }

    private void StopCapture()
    {
        try
        {
            if (Capturer != null)
            {
                Capturer.StopCapture();
                Capturer = null;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show("Error al detener la captura: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    // DPFP.Capture.EventHandler implementation
    public void OnComplete(object Capture, string ReaderSerialNumber, DPFP.Sample Sample)
    {
        try
        {
            Invoke(new Action(() => infoLabel.Text = "Huella capturada.\n________________________________________"));
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
                        lastSample = Sample; // Guarda el Sample para comparación
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
                        Invoke(new Action(() => infoLabel.Text = "Muestras necesarias restantes: " + enrollment.FeaturesNeeded + " - Coloca nuevamente el dedo"));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Invoke(new Action(() => infoLabel.Text = "Error en captura de huella: " + ex.Message));
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

    private void ApproveButton_Click(object sender, EventArgs e)
    {
        approveButton.Enabled = false;
        approveButton.Visible = false;
        startButton.Visible = false;
        stopButton.Visible = true;
        stopButton.Enabled = true;
        running = true;
        Thread approveThread = new Thread(ApproveTreatmentLoop) { IsBackground = true };
        approveThread.Start();
    }

    private void ApproveTreatmentLoop()
    {
        try
        {
            using (var conn = new MySqlConnection(connStr))
            {
                conn.Open();
                var task = GetPendingComparisonTask(conn);
                if (task == null)
                {
                    Invoke(new Action(() => {
                        MessageBox.Show("No hay tareas de comparación pendientes.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        running = false;
                        stopButton.Enabled = false;
                        stopButton.Visible = false;
                        startButton.Enabled = true;
                        startButton.Visible = true;
                        approveButton.Visible = true;
                        approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
                    }));
                    return;
                }

                int tutorId = Convert.ToInt32(task["id_tutor"]);
                string dedo = task["dedo"].ToString();
                int taskId = Convert.ToInt32(task["id"]);

                // Buscar huella registrada
                var cmd = new MySqlCommand("SELECT template FROM huellas WHERE tutor_id=@tutor_id AND dedo=@dedo LIMIT 1", conn);
                cmd.Parameters.AddWithValue("@tutor_id", tutorId);
                cmd.Parameters.AddWithValue("@dedo", dedo);
                var reader = cmd.ExecuteReader();
                if (!reader.Read())
                {
                    reader.Close();
                    MarkTaskFailed(conn, taskId, "No hay huella registrada para este tutor y dedo.");
                    Invoke(new Action(() => MessageBox.Show("No hay huella registrada para este tutor y dedo.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)));
                    return;
                }
                byte[] storedTemplate = (byte[])reader["template"];
                reader.Close();

                Invoke(new Action(() => infoLabel.Text = "Coloca el dedo para comparar..."));
                captured = false;
                lastTemplate = null;
                lastSample = null;
                enrollment = new DPFP.Processing.Enrollment();
                StartCapture();
                while (!captured)
                {
                    Thread.Sleep(500);
                }
                StopCapture();

                if (lastSample != null)
                {
                    bool match = CompareTemplates(storedTemplate, lastSample);
                    if (match)
                    {
                        string hash = ComputeSHA256Hash(lastTemplate);
                        MarkTaskCompletedWithResult(conn, taskId, hash);
                        Invoke(new Action(() => {
                            MessageBox.Show("Huella verificada y tratamiento aprobado.", "Éxito", MessageBoxButtons.OK, MessageBoxIcon.Information);
                            running = false;
                            stopButton.Enabled = false;
                            stopButton.Visible = false;
                            startButton.Enabled = true;
                            startButton.Visible = true;
                            approveButton.Visible = true;
                            approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
                        }));
                    }
                    else
                    {
                        MarkTaskFailed(conn, taskId, "La huella no coincide.");
                        Invoke(new Action(() => {
                            MessageBox.Show("La huella no coincide.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            running = false;
                            stopButton.Enabled = false;
                            stopButton.Visible = false;
                            startButton.Enabled = true;
                            startButton.Visible = true;
                            approveButton.Visible = true;
                            approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
                        }));
                    }
                }
            } // using asegura cierre de conexión
        }
        catch (Exception ex)
        {
            Invoke(new Action(() => {
                MessageBox.Show("Error en aprobación: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                running = false;
                stopButton.Enabled = false;
                stopButton.Visible = false;
                startButton.Enabled = true;
                startButton.Visible = true;
                approveButton.Visible = true;
                approveButton.Enabled = true; // <-- Asegura que siempre quede habilitado
            }));
        }
    }

    private DataRow GetPendingComparisonTask(MySqlConnection conn)
    {
        var da = new MySqlDataAdapter("SELECT * FROM tareas_huella WHERE estado='pendiente' AND tipo='comparacion' ORDER BY id ASC LIMIT 1", conn);
        var dt = new DataTable();
        da.Fill(dt);
        return dt.Rows.Count > 0 ? dt.Rows[0] : null;
    }

    private void MarkTaskCompletedWithResult(MySqlConnection conn, int taskId, string hash)
    {
        var cmd = new MySqlCommand("UPDATE tareas_huella SET estado='completado', resultado=@resultado, fecha_actualizacion=NOW() WHERE id=@id", conn);
        cmd.Parameters.AddWithValue("@id", taskId);
        cmd.Parameters.AddWithValue("@resultado", hash);
        cmd.ExecuteNonQuery();
    }

    private void MarkTaskFailed(MySqlConnection conn, int taskId, string error)
    {
        var cmd = new MySqlCommand("UPDATE tareas_huella SET estado='fallido', resultado=@resultado, fecha_actualizacion=NOW() WHERE id=@id", conn);
        cmd.Parameters.AddWithValue("@id", taskId);
        cmd.Parameters.AddWithValue("@resultado", error);
        cmd.ExecuteNonQuery();
    }

    // Utilidad para comparar dos templates de huella usando DPFPVerNET.dll
    private bool CompareTemplates(byte[] stored, DPFP.Sample sample)
    {
        try
        {
            var template = new DPFP.Template(new System.IO.MemoryStream(stored));
            var features = ExtractFeatures(sample, DPFP.Processing.DataPurpose.Verification);
            if (features == null) return false;
            var ver = new DPFP.Verification.Verification();
            DPFP.Verification.Verification.Result result = new DPFP.Verification.Verification.Result();
            ver.Verify(features, template, ref result);
            return result.Verified;
        }
        catch
        {
            return false;
        }
    }

    // Utilidad para hash SHA256
    private string ComputeSHA256Hash(byte[] data)
    {
        using (var sha = System.Security.Cryptography.SHA256.Create())
        {
            var hash = sha.ComputeHash(data);
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    }
}

// Clase principal para el entry point
public class Program
{
    [STAThread]
    public static void Main()
    {
        Application.EnableVisualStyles();
        Application.Run(new MainForm());
    }
}