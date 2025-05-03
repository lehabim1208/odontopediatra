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

  // Consultorio
  const [clinicId, setClinicId] = useState<number | null>(null)
  const [clinicName, setClinicName] = useState("")
  const [clinicAddress, setClinicAddress] = useState("")
  const [clinicEmail, setClinicEmail] = useState("")
  const [clinicLogo, setClinicLogo] = useState<string | null>(null)
  const [clinicLogoFile, setClinicLogoFile] = useState<File | null>(null)
  const [clinicLoading, setClinicLoading] = useState(false)

  // Perfil
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState("")
  const [userUsername, setUserUsername] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [userConfirmPassword, setUserConfirmPassword] = useState("")
  const [userLoading, setUserLoading] = useState(false)

  // Permiso para editar consultorio
  const [canEditClinic, setCanEditClinic] = useState(false)

  // Cargar datos de consultorio y usuario al montar
  useEffect(() => {
    // Consultorio
    setClinicLoading(true)
    fetch("/api/consultorio")
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setClinicId(data.id)
          setClinicName(data.nombre || "")
          setClinicAddress(data.direccion || "")
          setClinicEmail(data.correo || "")
          setClinicLogo(data.logo_ruta || null)
        }
      })
      .finally(() => setClinicLoading(false))

    // Usuario actual
    let userIdFromStorage = null
    if (typeof window !== "undefined") {
      const currentUser = window.localStorage.getItem("currentUser")
      if (currentUser) {
        try {
          userIdFromStorage = JSON.parse(currentUser).id
        } catch (e) {
          console.error("Error parseando currentUser:", e)
        }
      }
    }
    if (userIdFromStorage) {
      setUserId(userIdFromStorage)
      setUserLoading(true)
      console.log('Buscando usuario con id:', userIdFromStorage)
      fetch(`/api/usuarios/${userIdFromStorage}`)
        .then(res => {
          console.log('Respuesta cruda:', res)
          return res.json()
        })
        .then(data => {
          console.log('Respuesta backend usuario:', data)
          setUserName(typeof data.name === 'string' ? data.name : "")
          setUserUsername(typeof data.username === 'string' ? data.username : "")
          setUserEmail(typeof data.email === 'string' ? data.email : "")
        })
        .catch(err => {
          console.error('Error al hacer fetch del usuario:', err)
        })
        .finally(() => setUserLoading(false))
    } else {
      console.error('No se encontró el id de usuario en localStorage')
    }
    // Permiso para editar consultorio
    const users = storage.getItem("users") || []
    const current = users.find((u: any) => u.role === userRole)
    setCanEditClinic(current && current.permissions && current.permissions.clinic)
  }, [userRole])

  // Guardar consultorio
  const saveClinic = async () => {
    setClinicLoading(true)
    let logo_ruta = clinicLogo
    // Si hay archivo nuevo, deberías subirlo a tu backend y obtener la ruta
    // Aquí solo se simula el guardado de la ruta
    // TODO: Implementar subida real de archivos si lo necesitas
    const res = await fetch("/api/consultorio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: clinicName,
        correo: clinicEmail,
        direccion: clinicAddress,
        logo_ruta: logo_ruta,
      }),
    })
    if (res.ok) {
      toast({ title: "Configuración guardada", description: "La información del consultorio se ha guardado correctamente.", variant: "success" })
    } else {
      toast({ title: "Error", description: "No se pudo guardar la información del consultorio", variant: "destructive" })
    }
    setClinicLoading(false)
  }

  // Guardar perfil
  const saveProfile = async () => {
    if (!userId) return
    if (userPassword && userPassword !== userConfirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" })
      return
    }
    setUserLoading(true)
    const body: any = { name: userName, username: userUsername, email: userEmail }
    if (userPassword) body.password = userPassword
    if (userId === 1) body.allowAdminEdit = true
    const res = await fetch(`/api/usuarios/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast({ title: "Perfil actualizado", description: "Tu información se ha guardado correctamente.", variant: "success" })
      setUserPassword("")
      setUserConfirmPassword("")
    } else {
      toast({ title: "Error", description: "No se pudo guardar tu información", variant: "destructive" })
    }
    setUserLoading(false)
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
                <form className="space-y-6" onSubmit={e => { e.preventDefault(); saveClinic(); }}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Nombre del Consultorio</Label>
                      <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinicEmail">Correo Electrónico</Label>
                      <Input id="clinicEmail" type="email" value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Dirección</Label>
                    <Textarea id="clinicAddress" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clinicLogo">Logo del Consultorio</Label>
                      <Input id="clinicLogo" type="file" disabled />
                      {clinicLogo && <img src={clinicLogo} alt="Logo" className="h-16 mt-2" />}
                    </div>
                  </div>
                  <Button type="submit" disabled={clinicLoading}>
                    <Save className="mr-2 h-4 w-4" /> {clinicLoading ? "Guardando..." : "Guardar Cambios"}
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
                  <p><strong>Nombre:</strong> {clinicName}</p>
                  <p><strong>Dirección:</strong> {clinicAddress}</p>
                  <p><strong>Email:</strong> {clinicEmail}</p>
                  {clinicLogo && <img src={clinicLogo} alt="Logo" className="h-16 mt-2" />}
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
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); saveProfile(); }}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Nombre Completo</Label>
                    <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userUsername">Usuario</Label>
                    <Input id="userUsername" value={userUsername} onChange={(e) => setUserUsername(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Correo Electrónico</Label>
                    <Input id="userEmail" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">Nueva Contraseña</Label>
                    <Input id="userPassword" type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userConfirmPassword">Confirmar Contraseña</Label>
                    <Input id="userConfirmPassword" type="password" value={userConfirmPassword} onChange={(e) => setUserConfirmPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" />
                  </div>
                </div>
                <Button type="submit" disabled={userLoading}>
                  <Save className="mr-2 h-4 w-4" /> {userLoading ? "Guardando..." : "Guardar Cambios"}
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
