"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, PlusCircle, Edit, Trash, ArrowUp, ArrowDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Corregir la interfaz User y el estado inicial
interface User {
  id: number
  name: string
  username: string
  email: string
  password: string
  role: string
  permissions: {
    pacientes: boolean
    citas: boolean
    odontograma: boolean
    radiografias: boolean
    usuarios: boolean
    configuracion: boolean
    clinic: boolean
  }
}

// Modificar el estado newUser para incluir el nombre de usuario
const defaultNewUser = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "secretary",
}

export default function UsuariosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userRole, hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewUserDialog, setShowNewUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [roleFilter, setRoleFilter] = useState("")

  const [users, setUsers] = useState<User[]>([])
  const [newUser, setNewUser] = useState(defaultNewUser)

  // Estado para password y confirmPassword en edición
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");

  // Estado para el usuario a eliminar y el modal de confirmación
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Verificar si el usuario es doctor
  // Modificar el useEffect para actualizar los usuarios por defecto
  useEffect(() => {
    if (!hasPermission("usuarios")) {
      router.push("/")
      return
    }
    fetch("/api/usuarios")
      .then(res => res.json())
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [userRole, router, hasPermission])

  // Filter users based on search query and filters
  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (roleFilter === "" || user.role === roleFilter),
  )

  // Agregar la función de ordenamiento por nombre y rol
  interface SortConfig {
    key: keyof User
    direction: "asc" | "desc"
  }

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === "name") {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      return sortConfig.direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    } else if (sortConfig.key === "role") {
      const roleA = a.role.toLowerCase()
      const roleB = b.role.toLowerCase()
      return sortConfig.direction === "asc" ? roleA.localeCompare(roleB) : roleB.localeCompare(roleA)
    }
    return 0
  })

  const handleSort = (key: keyof User) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return email === "" || emailRegex.test(email)
  }

  // Handle new user form submission
  // Modificar la función handleAddUser para incluir el nombre de usuario
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password || !newUser.confirmPassword) {
      toast({ title: "Error", description: "Por favor complete todos los campos obligatorios", variant: "destructive", duration: 2500 })
      return
    }
    if (!isValidEmail(newUser.email)) {
      toast({ title: "Error", description: "El formato del correo electrónico no es válido", variant: "destructive", duration: 2500 })
      return
    }
    if (newUser.password !== newUser.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive", duration: 2500 })
      return
    }
    const userData = {
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      permissions: {
        pacientes: true,
        citas: true,
        odontograma: newUser.role === "doctor",
        radiografias: newUser.role === "doctor",
        usuarios: newUser.role === "doctor",
        configuracion: true,
        clinic: newUser.role === "doctor",
      },
    }
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    const data = await res.json()
    if (res.ok) {
      setShowNewUserDialog(false)
      setNewUser(defaultNewUser)
      fetch("/api/usuarios").then(r => r.json()).then(setUsers)
      toast({ title: "Éxito", description: "Usuario agregado correctamente", variant: "success", duration: 2500 })
    } else {
      toast({ title: "Error", description: data.error || "No se pudo agregar el usuario", variant: "destructive", duration: 2500 })
    }
  }

  // Modifica handleEditUser para proteger al admin y manejar errores de API
  const handleEditUser = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === 1) {
      toast({ title: "Error", description: "No se puede editar el usuario administrador principal", variant: "destructive", duration: 2500 });
      return;
    }
    if (!isValidEmail(selectedUser.email)) {
      toast({ title: "Error", description: "El formato del correo electrónico no es válido", variant: "destructive", duration: 2500 });
      return;
    }
    if (editPassword || editConfirmPassword) {
      if (editPassword !== editConfirmPassword) {
        toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive", duration: 2500 });
        return;
      }
      if (editPassword.length < 4) {
        toast({ title: "Error", description: "La contraseña debe tener al menos 4 caracteres", variant: "destructive", duration: 2500 });
        return;
      }
    }
    const body: any = {
      name: selectedUser.name,
      email: selectedUser.email,
      permissions: selectedUser.permissions,
    };
    if (editPassword) body.password = editPassword;
    try {
      const res = await fetch(`/api/usuarios/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Error inesperado del servidor" };
      }
      if (res.ok) {
        setShowEditUserDialog(false);
        fetch("/api/usuarios").then(r => r.json()).then(setUsers);
        toast({ title: "Éxito", description: "Usuario actualizado correctamente", variant: "success", duration: 2500 });
      } else {
        toast({ title: "Error", description: data.error || "No se pudo actualizar el usuario", variant: "destructive", duration: 2500 });
      }
    } catch (err) {
      toast({ title: "Error", description: "Error de red o del servidor", variant: "destructive", duration: 2500 });
    }
  }

  // Handle permissions update
  const handleUpdatePermissions = async () => {
    if (!selectedUser) return
    const res = await fetch(`/api/usuarios/${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selectedUser.name,
        email: selectedUser.email,
        permissions: selectedUser.permissions,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setShowPermissionsDialog(false)
      fetch("/api/usuarios").then(r => r.json()).then(setUsers)
      toast({ title: "Éxito", description: "Permisos actualizados correctamente. Los cambios se aplicarán en el próximo inicio de sesión.", variant: "success", duration: 2500 })
    } else {
      toast({ title: "Error", description: data.error || "No se pudo actualizar permisos", variant: "destructive", duration: 2500 })
    }
  }

  // Nueva función para mostrar el modal de confirmación
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  // Modificar handleDeleteUser para no usar confirm()
  const handleDeleteUser = async () => {
    if (!userToDelete) return
    if (userToDelete.id === 1) {
      toast({ title: "Error", description: "No se puede eliminar al usuario administrador principal", variant: "destructive", duration: 2500 })
      setShowDeleteDialog(false)
      return
    }
    const res = await fetch(`/api/usuarios/${userToDelete.id}`, { method: "DELETE" })
    let data = {}
    try {
      data = await res.json()
    } catch {
      data = {}
    }
    if (res.ok) {
      fetch("/api/usuarios").then(r => r.json()).then(setUsers)
      toast({ title: "Éxito", description: "Usuario eliminado correctamente", variant: "success" })
    } else {
      toast({ title: "Error", description: (data as any).error || "No se pudo eliminar el usuario", variant: "destructive", duration: 2500 })
    }
    setShowDeleteDialog(false)
    setUserToDelete(null)
  }

  // Al abrir el modal de edición, limpiar los campos de password
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setEditPassword("");
    setEditConfirmPassword("");
    setShowEditUserDialog(true);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary brand-name">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => setShowNewUserDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="section-title">Buscar Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={() => setShowFilterDialog(true)} className="flex-1 md:flex-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button className="flex-1 md:flex-auto">Buscar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="section-title">Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto w-full">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                        Nombre{" "}
                        {sortConfig.key === "name" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUp className="inline h-4 w-4" />
                          ) : (
                            <ArrowDown className="inline h-4 w-4" />
                          ))}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Usuario</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort("role")}>
                        Rol{" "}
                        {sortConfig.key === "role" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUp className="inline h-4 w-4" />
                          ) : (
                            <ArrowDown className="inline h-4 w-4" />
                          ))}
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.length > 0 ? (
                      sortedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                            <div className="md:hidden text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Usuario:</span> {user.username}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {user.email}
                              </div>
                              <div>
                                <span className="font-medium">Rol:</span>{" "}
                                {user.role === "doctor" ? "Doctor" : "Secretaria"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{user.username}</TableCell>
                          <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user.role === "doctor" ? "Doctor" : "Secretaria"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                title="Editar"
                                onClick={() => openEditUserDialog(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Permisos"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowPermissionsDialog(true)
                                }}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Eliminar"
                                onClick={() => confirmDeleteUser(user)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New User Dialog */}
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="section-title">Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Ingrese los datos del nuevo usuario. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="name" className="md:text-right">
                  Nombre *
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="col-span-1 md:col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="username" className="md:text-right">
                  Usuario *
                </Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="col-span-1 md:col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="email" className="md:text-right">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-1 md:col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="password" className="md:text-right">
                  Contraseña *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="col-span-1 md:col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="confirmPassword" className="md:text-right">
                  Confirmar Contraseña *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="col-span-1 md:col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="role" className="md:text-right">
                  Rol *
                </Label>
                <div className="col-span-1 md:col-span-3">
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="secretary">Secretaria</option>
                  </select>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowNewUserDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleAddUser} className="w-full sm:w-auto">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="section-title">Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifique los datos del usuario. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <ScrollArea className="max-h-[60vh]">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                  <Label htmlFor="edit-name" className="md:text-right">
                    Nombre *
                  </Label>
                  <Input
                    id="edit-name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    className="col-span-1 md:col-span-3"
                    required
                    disabled={selectedUser.id === 1}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                  <Label htmlFor="edit-email" className="md:text-right">
                    Email *
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    className="col-span-1 md:col-span-3"
                    required
                    disabled={selectedUser.id === 1}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                  <Label htmlFor="edit-role" className="md:text-right">
                    Rol *
                  </Label>
                  <div className="col-span-1 md:col-span-3">
                    <select
                      id="edit-role"
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={selectedUser.id === 1} // No permitir cambiar el rol del usuario principal
                    >
                      <option value="doctor">Doctor</option>
                      <option value="secretary">Secretaria</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                  <Label htmlFor="edit-password" className="md:text-right">
                    Nueva Contraseña
                  </Label>
                  <Input
                    id="edit-password"
                    type="password"
                    placeholder="Dejar en blanco para no cambiar"
                    className="col-span-1 md:col-span-3"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                  <Label htmlFor="edit-confirm-password" className="md:text-right">
                    Confirmar Contraseña
                  </Label>
                  <Input
                    id="edit-confirm-password"
                    type="password"
                    placeholder="Dejar en blanco para no cambiar"
                    className="col-span-1 md:col-span-3"
                    value={editConfirmPassword}
                    onChange={e => setEditConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleEditUser} className="w-full sm:w-auto">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="section-title">Permisos de Usuario</DialogTitle>
            <DialogDescription>{selectedUser && `Configurar permisos para ${selectedUser.name}`}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4 pr-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pacientes</Label>
                    <p className="text-sm text-muted-foreground">Acceso a la gestión de pacientes</p>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.pacientes}
                    onCheckedChange={(checked) =>
                      setSelectedUser({
                        ...selectedUser,
                        permissions: { ...selectedUser.permissions, pacientes: checked },
                      })
                    }
                    disabled={selectedUser.id === 1} // No permitir cambiar permisos del usuario principal
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Citas</Label>
                    <p className="text-sm text-muted-foreground">Acceso a la gestión de citas</p>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.citas}
                    onCheckedChange={(checked) =>
                      setSelectedUser({
                        ...selectedUser,
                        permissions: { ...selectedUser.permissions, citas: checked },
                      })
                    }
                    disabled={selectedUser.id === 1}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Odontograma</Label>
                    <p className="text-sm text-muted-foreground">Acceso al odontograma digital</p>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.odontograma}
                    onCheckedChange={(checked) =>
                      setSelectedUser({
                        ...selectedUser,
                        permissions: { ...selectedUser.permissions, odontograma: checked },
                      })
                    }
                    disabled={selectedUser.id === 1}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Documentos médicos</Label>
                    <p className="text-sm text-muted-foreground">Acceso a los documentos médicos</p>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.radiografias}
                    onCheckedChange={(checked) =>
                      setSelectedUser({
                        ...selectedUser,
                        permissions: { ...selectedUser.permissions, radiografias: checked },
                      })
                    }
                    disabled={selectedUser.id === 1}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Usuarios</Label>
                    <p className="text-sm text-muted-foreground">Acceso a la gestión de usuarios</p>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.usuarios}
                    onCheckedChange={(checked) =>
                      setSelectedUser({
                        ...selectedUser,
                        permissions: { ...selectedUser.permissions, usuarios: checked },
                      })
                    }
                    disabled={selectedUser.id === 1}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Configuración</Label>
                    <p className="text-sm text-muted-foreground">Acceso a la configuración del sistema</p>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.configuracion}
                    onCheckedChange={(checked) =>
                      setSelectedUser({
                        ...selectedUser,
                        permissions: { ...selectedUser.permissions, configuracion: checked },
                      })
                    }
                    disabled={selectedUser.id === 1}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Editar Información del Consultorio</Label>
                    <p className="text-sm text-muted-foreground">Permiso para editar información del consultorio</p>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.clinic}
                    onCheckedChange={(checked) =>
                      setSelectedUser({
                        ...selectedUser,
                        permissions: { ...selectedUser.permissions, clinic: checked },
                      })
                    }
                    disabled={selectedUser.id === 1}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleUpdatePermissions} className="w-full sm:w-auto">
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-[400px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="section-title">Filtros de Búsqueda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleFilter">Rol</Label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Todos</option>
                <option value="doctor">Doctor</option>
                <option value="secretary">Secretaria</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRoleFilter("")
              }}
              className="w-full sm:w-auto"
            >
              Limpiar
            </Button>
            <Button onClick={() => setShowFilterDialog(false)} className="w-full sm:w-auto">
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar usuario */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el usuario <b>{userToDelete?.name}</b>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-white hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
