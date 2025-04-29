"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Save, User, Building, Bell, Info } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { storage } from "@/lib/storage"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function ConfiguracionPage() {
  const { hasPermission, userRole } = useAuth()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Clinic information state
  const [clinicName, setClinicName] = useState("")
  const [clinicAddress, setClinicAddress] = useState("")
  const [clinicPhone, setClinicPhone] = useState("")
  const [clinicEmail, setClinicEmail] = useState("")

  // User profile state
  const [userName, setUserName] = useState(userRole === "doctor" ? "Dr. Emmanuel" : "Srita. Marcela")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [reminderTime, setReminderTime] = useState("24")

  const [canEditClinic, setCanEditClinic] = useState(false)

  // Ensure clinic information is visible to all users
  useEffect(() => {
    // Verificar si el usuario tiene permiso para editar la información del consultorio
    const users = storage.getItem("users") || []
    const currentUser = users.find((u: any) => u.role === userRole)

    // Verificar si el usuario tiene el permiso específico para editar la información del consultorio
    setCanEditClinic(currentUser && currentUser.permissions && currentUser.permissions.clinic)

    // Cargar información del usuario desde localStorage
    const userConfig = storage.getItem("userConfig")
    if (userConfig) {
      setUserName(userConfig.userName || userName)
      setUserEmail(userConfig.userEmail || "")
      setUserPhone(userConfig.userPhone || "")
    }

    // Cargar información del consultorio desde localStorage o usar valores predeterminados
    const clinicConfig = storage.getItem("clinicConfig")
    if (clinicConfig) {
      setClinicName(clinicConfig.clinicName || "Odontopediatra Emmanuel Severino")
      setClinicAddress(clinicConfig.clinicAddress || "Calle paseo del 17 de octubre #12. Colonia sahop")
      setClinicPhone(clinicConfig.clinicPhone || "+52 228 243 3062")
      setClinicEmail(clinicConfig.clinicEmail || "dremmanuel@gmail.com")
    } else {
      // Valores predeterminados si no hay configuración guardada
      setClinicName("Odontopediatra Emmanuel Severino")
      setClinicAddress("Calle paseo del 17 de octubre #12. Colonia sahop")
      setClinicPhone("+52 228 243 3062")
      setClinicEmail("dremmanuel@gmail.com")

      // Guardar los valores predeterminados en el almacenamiento
      storage.setItem("clinicConfig", {
        clinicName: "Odontopediatra Emmanuel Severino",
        clinicAddress: "Calle paseo del 17 de octubre #12. Colonia sahop",
        clinicPhone: "+52 228 243 3062",
        clinicEmail: "dremmanuel@gmail.com",
      })
    }

    const notificationConfig = storage.getItem("notificationConfig")
    if (notificationConfig) {
      setEmailNotifications(
        notificationConfig.emailNotifications !== undefined
          ? notificationConfig.emailNotifications
          : emailNotifications,
      )
      setSmsNotifications(
        notificationConfig.smsNotifications !== undefined ? notificationConfig.smsNotifications : smsNotifications,
      )
      setReminderTime(notificationConfig.reminderTime || reminderTime)
    }
  }, [userRole, userName])

  // Save settings
  const saveSettings = (section: string) => {
    switch (section) {
      case "consultorio":
        const clinicConfig = {
          clinicName,
          clinicAddress,
          clinicPhone,
          clinicEmail,
        }
        storage.setItem("clinicConfig", clinicConfig)
        break
      case "perfil":
        const userConfig = {
          userName,
          userEmail,
          userPhone,
        }
        storage.setItem("userConfig", userConfig)
        break
      case "notificaciones":
        const notificationConfig = {
          emailNotifications,
          smsNotifications,
          reminderTime,
        }
        storage.setItem("notificationConfig", notificationConfig)
        break
    }

    toast({
      title: "Configuración guardada",
      description: `La configuración de ${section} se ha guardado correctamente.`,
      variant: "success",
      duration: 3000,
    })
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Configuración</h1>
          <p className="text-muted-foreground">Personaliza tu experiencia en el sistema</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Consultorio</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          {hasPermission("notifications") && (
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
          )}
          {/* Ocultar la pestaña "Acerca de" en dispositivos móviles */}
          {!isMobile && (
            <TabsTrigger value="acerca-de" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Acerca de</span>
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="clinic">
          {canEditClinic ? (
            <Card>
              <CardHeader>
                <CardTitle>Información del Consultorio</CardTitle>
                <CardDescription>Actualiza la información de tu consultorio dental</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Nombre del Consultorio</Label>
                      <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinicEmail">Correo Electrónico</Label>
                      <Input
                        id="clinicEmail"
                        type="email"
                        value={clinicEmail}
                        onChange={(e) => setClinicEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Dirección</Label>
                    <Textarea
                      id="clinicAddress"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clinicPhone">Teléfono</Label>
                      <Input id="clinicPhone" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinicLogo">Logo del Consultorio</Label>
                      <Input id="clinicLogo" type="file" />
                    </div>
                  </div>

                  <Button type="button" onClick={() => saveSettings("consultorio")}>
                    <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Información del Consultorio</CardTitle>
                <CardDescription>Solo el Dr. Emmanuel puede modificar esta información</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Nombre:</strong> {clinicName}
                  </p>
                  <p>
                    <strong>Dirección:</strong> {clinicAddress}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {clinicPhone}
                  </p>
                  <p>
                    <strong>Email:</strong> {clinicEmail}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Nombre Completo</Label>
                    <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Correo Electrónico</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userPhone">Teléfono</Label>
                    <Input id="userPhone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userPhoto">Foto de Perfil</Label>
                    <Input id="userPhoto" type="file" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input id="currentPassword" type="password" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>

                <Button type="button" onClick={() => saveSettings("perfil")}>
                  <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Personaliza cómo y cuándo recibes notificaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe recordatorios de citas por correo electrónico
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNotifications">Notificaciones por SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe recordatorios de citas por mensaje de texto
                      </p>
                    </div>
                    <Switch id="smsNotifications" checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Tiempo de Recordatorio</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Select value={reminderTime} onValueChange={setReminderTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tiempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora antes</SelectItem>
                        <SelectItem value="2">2 horas antes</SelectItem>
                        <SelectItem value="24">24 horas antes</SelectItem>
                        <SelectItem value="48">48 horas antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="button" onClick={() => saveSettings("notificaciones")}>
                  <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="acerca-de">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Acerca de</CardTitle>
              <CardDescription>Información sobre el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-full overflow-x-hidden">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Sobre el sistema</h3>
                <p className="break-words text-sm sm:text-base">
                  Este sistema de Odontología Pediátrica está diseñado para optimizar la gestión de pacientes,
                  historiales clínicos y citas médicas en consultorios especializados en la atención infantil. Su
                  interfaz intuitiva y herramientas avanzadas facilitan el trabajo de los profesionales de la salud,
                  mejorando la experiencia tanto para médicos como para pacientes.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Características principales</h3>
                <ul className="list-disc list-inside text-sm sm:text-base">
                  <li>Registro y gestión de pacientes pediátricos</li>
                  <li>Historial clínico detallado y seguro</li>
                  <li>Programación y administración de citas</li>
                  <li>Interfaz amigable y adaptada para uso profesional</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Licencia y uso</h3>
                <p className="text-sm sm:text-base">
                  Este software está disponible bajo la licencia Creative Commons Atribución-NoComercial 4.0
                  Internacional (CC BY-NC 4.0). Esto significa que puedes:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base">
                  <li>Usarlo y compartirlo libremente</li>
                  <li>Modificarlo y adaptarlo a tus necesidades</li>
                  <li>No utilizarlo con fines comerciales sin autorización</li>
                  <li>Respetar la atribución al creador original</li>
                </ul>
                <p className="break-words text-sm sm:text-base">
                  Para más información sobre esta licencia, visita:{" "}
                  <a
                    href="https://creativecommons.org/licenses/by-nc/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    https://creativecommons.org/licenses/by-nc/4.0/
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
