import React, { useEffect, useState, useMemo } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Box,
  MenuItem,
  Chip,
  Select,
  InputLabel,
  FormControl,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Plus,
  Trash2,
  Pencil,
  Settings,
  Layers,
  Users,
  Globe2,
  Mail,
  Send,
} from "lucide-react";
import { User, UserRole, MAX_USERS, Category, Area, CreateCategoryRequest, UpdateCategoryRequest, CreateAreaRequest } from "../types";
import { apiRequest } from "../lib/apiClient";
import { log } from "console";
import Swal from "sweetalert2";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface CreateUserIdResponse {
  id: number;
}

interface EmailConfig {
  email: string;
  isConfigured: boolean;
}

interface EmailConfigRequest {
  email: string;
  password: string;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdminConfig: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // --- Email Config Logic ---
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [emailForm, setEmailForm] = useState({ email: emailConfig?.email ?? "", password: "" });
  const [testEmailForm, setTestEmailForm] = useState({ 
    to: "", 
    subject: "Correo de prueba", 
    text: "Este es un correo de prueba del sistema." 
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const fetchEmailConfig = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: EmailConfig }>('/email/config', 'GET', { authToken: token });
      setEmailConfig(res.data);
      setEmailForm({ email: res.data.email || "", password: "" });
    } catch (err) {
      console.error('Error fetching email config:', err);
    }
  };

  const handleSaveEmailConfig = async () => {
    if (!emailForm.email || !emailForm.password) {
      setEmailError('Complete todos los campos');
      return;
    }
    try {
      setEmailLoading(true);
      setEmailError('');
      setEmailSuccess('');
      await apiRequest('/email/config', 'PUT', {
        authToken: token,
        body: emailForm as any,
      });
      setEmailSuccess('Configuración guardada');
      fetchEmailConfig();
      setEmailForm({ email: '', password: '' });
    } catch (err: any) {
      setEmailError(err.message || 'Error al guardar configuración');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteEmailConfig = async () => {
    Swal.fire({
      title: '¿Eliminar configuración de correo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e51b24',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await apiRequest('/email/config', 'DELETE', { authToken: token });
        setEmailConfig(null);
        setEmailSuccess('Configuración eliminada');
      } catch (err: any) {
        setEmailError(err.message || 'Error al eliminar configuración');
      }
    });
  };

  const handleSendTestEmail = async () => {
    if (!testEmailForm.to) {
      setEmailError('Ingrese un correo destinatario');
      return;
    }
    try {
      setEmailLoading(true);
      setEmailError('');
      setEmailSuccess('');
      const formData = new FormData();
      formData.append('to', testEmailForm.to);
      formData.append('subject', testEmailForm.subject);
      formData.append('text', testEmailForm.text);
      
      await fetch(`${import.meta.env.VITE_API_URL}/email/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setEmailSuccess('Correo de prueba enviado');
      setTestEmailForm({ ...testEmailForm, to: '' });
    } catch (err: any) {
      setEmailError(err.message || 'Error al enviar correo de prueba');
    } finally {
      setEmailLoading(false);
    }
  };

  // --- Categories and Areas Logic ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedCategory, setEditedCategory] = useState<UpdateCategoryRequest>({ nombre: "" });
  const [newArea, setNewArea] = useState("");
  const [selectedCategoryForArea, setSelectedCategoryForArea] = useState<number | null>(null);

  // --- Countries Logic ---
  const [newCountry, setNewCountry] = useState("");
  const [countries, setCountries] = useState<string[]>([]);

  // Helper function to get all areas from all categories
  const getAllAreas = () => {
    const allAreas: { id: number; name: string }[] = [];
    categories?.forEach(category => {
      category.areas?.forEach(area => {
        allAreas.push({ id: area.id, name: area.name });
      });
    });
    return allAreas;
  };

  // --- Users Logic ---
  const initialNewUser: Partial<User> = {
    name: "",
    email: "",
    role: "specialist",
    countryId: "",
    area: "", // This will store area ID as string
    assignableTo: [],
    receivableFrom: [],
  };

  const [newUser, setNewUser] = useState<Partial<User>>(initialNewUser);

  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const countryUsers = useMemo(
    () => users.filter((u) => u.country.id === newUser.countryId),
    [users, newUser.countryId]
  );
  const token = localStorage.getItem("token") || undefined;

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [usersRes, categoriesRes, countriesRes] = await Promise.all([
          apiRequest<User[]>("/users", "GET", { authToken: token }),
          apiRequest<Category[]>("/categorias", "GET", { authToken: token }),
          apiRequest<string[]>("/countries", "GET", { authToken: token }),
        ]);

        console.log("Categories API response:", categoriesRes);
        console.log("Users:", usersRes);
        console.log("Token being used:", token);
        setUsers(usersRes);
        console.log("Categories:", categoriesRes)
        setCategories(categoriesRes);
        console.log("Countries:", countriesRes)
        setCountries(countriesRes);
      } catch (e) {
        console.error("Error fetching data:", e);
        setError("Error al cargar datos del servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // --- Category Management Functions ---
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const response = await apiRequest<Category>('/categorias', 'POST', {
        authToken: token,
        body: { nombre: newCategory.trim() } as CreateCategoryRequest,
      });
      setCategories([...categories, response]);
      setNewCategory("");
      Swal.fire({ icon: "success", title: "Categoría agregada" });
    } catch (err: any) {
      console.error("Error adding category:", err);
      Swal.fire({ icon: "error", title: "Error al agregar la categoría" });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditedCategory({ nombre: category.nombre });
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategory || !editedCategory.nombre.trim()) return;
    
    try {
      const response = await apiRequest<Category>(`/categorias/${editingCategory.id}`, 'PUT', {
        authToken: token,
        body: editedCategory as any,
      });
      setCategories(categories.map(cat => cat.id === editingCategory.id ? response : cat));
      setEditingCategory(null);
      setEditedCategory({ nombre: "" });
      Swal.fire({ icon: "success", title: "Categoría actualizada" });
    } catch (err: any) {
      console.error("Error updating category:", err);
      Swal.fire({ icon: "error", title: "Error al actualizar la categoría" });
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    Swal.fire({
      title: `¿Eliminar categoría "${category.nombre}"?`,
      text: "",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e51b24',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
       const response = await apiRequest(`/categorias/${category.id}`, 'DELETE', { authToken: token });
        setCategories(categories.filter(cat => cat.id !== category.id));
        Swal.fire({ icon: "success", title: "Categoría eliminada" });
      } catch (err: any) {
        console.error("Error deleting category:", err);
        // Extraer el mensaje de error del JSON dentro del err.message
        const messageStart = err.message.indexOf('{');
        const errorJson = messageStart !== -1 ? err.message.substring(messageStart) : '{}';
        const errorData = JSON.parse(errorJson);
        Swal.fire({ 
          icon: "error", 
          title: "Error al eliminar la categoría", 
          text: errorData.error || "Error desconocido" 
        });
      }
    });
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditedCategory({ nombre: "" });
  };

  // --- Area Management Functions ---
  const handleAddArea = async () => {
    if (!newArea.trim() || selectedCategoryForArea === null) return;
    
    try {
      await apiRequest('/areas', 'POST', {
        authToken: token,
        body: { 
          name: newArea.trim(),
          categoryId: selectedCategoryForArea 
        } as any,
      });
      
      // Refetch categories to get updated data with area IDs
      const categoriesRes = await apiRequest<Category[]>('/categorias', 'GET', { authToken: token });
      setCategories(categoriesRes);
      
      setNewArea("");
      setSelectedCategoryForArea(null);
      Swal.fire({ icon: "success", title: "Área agregada" });
    } catch (err: any) {
      console.error("Error adding area:", err);
      Swal.fire({ icon: "error", title: "Error al agregar el área" });
    }
  };

  const handleDeleteArea = async (area: any) => {
    console.log("Deleting area:", area);
    
    // Always use the area ID
    const areaId = area.id;
    console.log("Using area ID:", areaId);
    
    if (!areaId) {
      Swal.fire({ icon: "error", title: "Error: El área no tiene ID" });
      return;
    }
    
    Swal.fire({
      title: `¿Eliminar área "${area.name || area}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e51b24',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const endpoint = `/areas/${areaId}`;
        console.log("Making DELETE request to:", endpoint);
        
        await apiRequest(endpoint, 'DELETE', { 
          authToken: token,
        });
        
        // Update categories by removing the deleted area
        setCategories(prevCategories => 
          prevCategories.map(cat => ({
            ...cat,
            areas: cat.areas.filter(a => a.id !== areaId)
          }))
        );
        
        Swal.fire({ icon: "success", title: "Área eliminada" });
      } catch (err: any) {
        console.error("Error deleting area:", err);
        Swal.fire({ icon: "error", title: "Error al eliminar el área" });
      }
    });
  };

  const handleAddUser = () => {
    if (users.length >= MAX_USERS) {
      alert(
        "Ha alcanzado el límite de usuarios permitidos (50). Contacte a soporte para ampliar su plan."
      );
      return;
    }
    if (!newUser.name || !newUser.email) return;

    const userPayload = {
      name: newUser.name || "",
      email: newUser.email || "",
      role: newUser.role || "specialist",
      countryId: newUser.countryId || "",
      areaId: Number(newUser.area) || 0, // Convert area ID string to number
      password: "tempPassword123", // Contraseña temporal requerida por el backend
      assignableTo: newUser.assignableTo || [],
      receivableFrom: newUser.receivableFrom || [],
    };

    apiRequest<CreateUserIdResponse>("/users", "POST", {
      authToken: token,
      body: userPayload as any,
    })
      .then((res) => {
        Swal.fire({ icon: "success", title: "Usuario creado" });
        // reset form
        setNewUser(initialNewUser);
        apiRequest<User[]>("/users", "GET", { authToken: token })
          .then((usersData) => {
            setUsers(usersData);
          })
          .catch((err) => {
            console.error("Error fetching users:", err);
          });
      })
      .catch((err) => {
        console.error("Error adding user:", err);
        Swal.fire({ icon: "error", title: "Error al agregar el usuario" });
      });
  };

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  useEffect(() => {
    console.log("Users:", users);
  }, [users]);

  // --- Countries Handlers ---
  const handleAddCountry = () => {
    if (newCountry && !countries.includes(newCountry)) {
      apiRequest("/countries", "POST", {
        authToken: token,
        body: { country_name: newCountry.trim() } as any,
      })
        .then(() => {
          apiRequest<string[]>("/countries", "GET", { authToken: token })
            .then((res: string[]) => {
              setCountries(res);
              Swal.fire({ icon: "success", title: "País agregado" });
            })
            .catch((err) => {
              console.error("Error fetching countries:", err);
              Swal.fire({ icon: "error", title: "Error al actualizar la lista de países" });
            });
          setNewCountry("");
        })
        .catch((err: any) => {
          console.error("Error adding country:", err);
          // Extraer el mensaje de error del JSON dentro del err.message
          const messageStart = err.message.indexOf('{');
          const errorJson = messageStart !== -1 ? err.message.substring(messageStart) : '{}';
          const errorData = JSON.parse(errorJson);
          Swal.fire({ 
            icon: "error", 
            title: "Error al agregar el país", 
            text: errorData.error || errorData.message || "Error desconocido" 
          });
        });
    }
  };

  const handleEditCountry = (country: { id: string; country_name: string }) => {
    const newName = prompt(
      "Nuevo nombre del país",
      country.country_name
    )?.trim();
    if (!newName || newName === country.country_name) return;
    apiRequest(`/countries/${country.id}`, "PUT", {
      authToken: token,
      body: { country_name: newName } as any,
    })
      .then(() => {
        setCountries(
          countries.map((c) =>
            c === country.id ? newName : c
          )
        );
        // update users referencing the country
      })
      .catch((err) => {
        console.error("Error editing country:", err);
        Swal.fire({ icon: "error", title: "Error al editar el país" });
      });
  };

  const handleDeleteCountry = (c: string) => {
    Swal.fire({
      title: "¿Eliminar país?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e51b24",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (!result.isConfirmed) return;
      apiRequest(`/countries/${c}`, "DELETE", { authToken: token })
      .then(() => {
        setCountries(countries.filter((country) => country !== c));
        Swal.fire({ icon: "success", title: "País eliminado" });
      })  
        .catch((err) => {
          console.error("Error deleting country:", err);
          Swal.fire({ icon: "error", title: "Error al eliminar el país" });
        });
    });
  };

  // --- Edit User Helpers ---
  const handleOpenEditUser = (user: User) => {
    console.log("Opening edit user:", user);
    setEditingUser(user);
    // Convert area to string ID for the select field
    const areaId = typeof user.area === 'string' ? user.area : user.area?.id?.toString() || "";
    setEditedUser({ 
      ...user,
      area: areaId
    });
  };

  const handleCloseEditUser = () => {
    setEditingUser(null);
    setEditedUser({});
  };

  const handleSaveEditedUser = async () => {
    if (!editingUser) return;
    const editedUserData = {
      name: editedUser.name || "",
      email: editedUser.email || "",
      countryId: editedUser.country?.id || "",
      areaId: Number(editedUser.area) || 0, // Convert area ID string to number
      role: editedUser.role || "",
      assignableTo: editedUser.assignableTo || [],
      receivableFrom: editedUser.receivableFrom || [],
    };
    try {
      setIsSavingEdit(true);
      apiRequest(`/users/${editingUser.id}`, "PUT", {
        authToken: token,
        body: editedUserData as any,
      }).then(() => {
        apiRequest<User[]>("/users", "GET", {
          authToken: token,
        }).then((usersData) => {
          setUsers(usersData);
          handleCloseEditUser();
        });
        setIsSavingEdit(false);
        Swal.fire({
          icon: "success",
          title: "Usuario actualizado correctamente",
        });
      });
    } catch (err) {
      console.error("Error editing user:", err);
      Swal.fire({ icon: "error", title: "Error al actualizar el usuario" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // prune relations when country changes
  useEffect(() => {
    setNewUser((prev) => ({
      ...prev,
      assignableTo: (prev.assignableTo || []).filter((id) =>
        countryUsers.some((u) => u.id === id)
      ),
      receivableFrom: (prev.receivableFrom || []).filter((id) =>
        countryUsers.some((u) => u.id === id)
      ),
    }));
  }, [newUser.country, countryUsers]);

  const handleDeleteUser = (id: string) => {
    Swal.fire({
      title: "¿Eliminar usuario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e51b24",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (!result.isConfirmed) return;
      apiRequest("/users/" + id, "DELETE", { authToken: token })
        .then(() => {
          setUsers(users.filter((u) => u.id !== id));
        })
        .catch((err) => {
          console.error("Error deleting user:", err);
          Swal.fire({ icon: "error", title: "Error al eliminar el usuario" });
        });
    });
  };

  // Helpers for multi-select rendering
  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name || id;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e242b] flex items-center gap-3">
          <Settings className="text-[#e51b24]" size={32} />
          Configuración del Sistema
        </h1>
        <p className="text-gray-500 mt-1">
          Administre las opciones globales del Service Desk.
        </p>
      </div>

      <Paper className="shadow-lg rounded-2xl overflow-hidden bg-white">
        <Box
          sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f9fafb" }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            aria-label="config tabs"
          >
            <Tab
              label="Gestión de Usuarios"
              icon={<Users size={18} />}
              iconPosition="start"
            />
            <Tab
              label="Categorías y Áreas"
              icon={<Layers size={18} />}
              iconPosition="start"
            />
            <Tab
              label="Países"
              icon={<Globe2 size={18} />}
              iconPosition="start"
            />
            <Tab
              label="Correo"
              icon={<Mail size={18} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* --- TAB 1: USERS --- */}
        <CustomTabPanel value={tabValue} index={0}>
          <div className="px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Typography variant="h6" className="font-bold text-[#1e242b]">
                  Directorio de Usuarios
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  Administre el acceso, roles y permisos de asignación.
                </Typography>
              </div>
              <div
                className={`px-4 py-2 rounded-lg border ${
                  users.length >= MAX_USERS
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                }`}
              >
                <span className="text-sm font-bold">
                  Usuarios: {users.length} / {MAX_USERS}
                </span>
              </div>
            </div>

            {/* New User Form */}
            <Paper variant="outlined" className="p-6 mb-8 bg-gray-50/50">
              <Typography
                variant="subtitle2"
                className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider"
              >
                Agregar Nuevo Usuario
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <TextField
                  label="Nombre Completo"
                  size="small"
                  fullWidth
                  required
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
                <TextField
                  label="Correo Electrónico"
                  size="small"
                  fullWidth
                  required
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
                <TextField
                  select
                  label="Rol / Perfil"
                  size="small"
                  fullWidth
                  required
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value as UserRole })
                  }
                >
                  <MenuItem value="admin">
                    Administrador (Control Total)
                  </MenuItem>
                  <MenuItem value="agent">
                    Jefe (Ingresar y Recibir Tickets)
                  </MenuItem>
                  <MenuItem value="specialist">
                    Operativo (Solo Recibir Tickets)
                  </MenuItem>
                </TextField>

                <TextField
                  select
                  label="País"
                  size="small"
                  fullWidth
                  value={newUser.countryId}
                  onChange={(e) =>
                    setNewUser({ ...newUser, countryId: e.target.value })
                  }
                >
                  {countries?.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.country_name}
                    </MenuItem>
                  ))}
                </TextField>

                {/* password temporal: tempPassword123 - se puede cambiar después del primer login */}
                {/* Este password se asigna automáticamente y el usuario debe cambiarlo en su primer inicio de sesión */}

                <TextField
                  size="small"
                  value="tempPassword123"
                  label="Contraseña Temporal"
                  InputProps={{
                    readOnly: true,
                  }}
                />

                <TextField
                  select
                  label="Área"
                  size="small"
                  fullWidth
                  value={newUser.area}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      area: e.target.value,
                    })
                  }
                >
                  {getAllAreas().map((area) => (
                    <MenuItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </MenuItem>
                  ))}
                </TextField>
              </div>

              {/* Relations Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormControl size="small" fullWidth>
                  <InputLabel>
                    Personas a cargo (Puede asignar tickets a)
                  </InputLabel>
                  <Select
                    multiple
                    value={newUser.assignableTo || []}
                    label="Personas a cargo (Puede asignar tickets a)"
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        assignableTo:
                          typeof e.target.value === "string"
                            ? e.target.value.split(",")
                            : e.target.value,
                      })
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={getUserName(value)}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {countryUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Puede recibir tickets de</InputLabel>
                  <Select
                    multiple
                    value={newUser.receivableFrom || []}
                    label="Puede recibir tickets de"
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        receivableFrom:
                          typeof e.target.value === "string"
                            ? e.target.value.split(",")
                            : e.target.value,
                      })
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={getUserName(value)}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {countryUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name} ({u.stringrole})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Plus />}
                  onClick={handleAddUser}
                  disabled={
                    !newUser.name || !newUser.email || users.length >= MAX_USERS
                  }
                  sx={{ backgroundColor: "#1e242b" }}
                >
                  Crear Usuario
                </Button>
              </div>
              {users.length >= MAX_USERS && (
                <Alert severity="warning" className="mt-4">
                  Límite de usuarios alcanzado. Para agregar más usuarios (costo
                  extra), contacte a ventas.
                </Alert>
              )}
            </Paper>

            {/* Users List */}
            <div className="space-y-3">
              {users.map((user) => (
                <Paper
                  key={user.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <Avatar src={user.avatar} />
                    <div>
                      <Typography
                        variant="subtitle2"
                        className="font-bold text-[#1e242b]"
                      >
                        {user.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        className="text-gray-500 block"
                      >
                        {user.email}
                      </Typography>
                      <div className="flex gap-2 mt-1">
                        <Chip
                          label={
                            user.role === "admin"
                              ? "Admin"
                              : user.role === "agent"
                              ? "Jefe"
                              : "Operativo"
                          }
                          size="small"
                          color={
                            user.role === "admin"
                              ? "error"
                              : user.role === "agent"
                              ? "primary"
                              : "default"
                          }
                          variant="outlined"
                          className="h-5 text-[10px]"
                        />
                        <Chip
                          label={user.country.country_name}
                          size="small"
                          className="h-5 text-[10px]"
                        />
                        <Chip
                          label={typeof user.area === 'string' ? user.area : user.area?.name}
                          size="small"
                          className="h-5 text-[10px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-gray-500 min-w-[200px]">
                    <div>
                      <span className="font-bold text-gray-700">
                        A cargo de:{" "}
                      </span>
                      {user.assignableTo && user.assignableTo.length > 0
                        ? user.assignableTo.length + " usuarios"
                        : "Nadie"}
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">
                        Recibe de:{" "}
                      </span>
                      {user.receivableFrom && user.receivableFrom.length > 0
                        ? user.receivableFrom.length + " usuarios"
                        : "Nadie"}
                    </div>
                  </div>

                  <div>
                    <IconButton
                      onClick={() => handleOpenEditUser(user)}
                      color="primary"
                    >
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteUser(user.id)}
                      color="error"
                      disabled={user.role === "admin"}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </div>
                </Paper>
              ))}
            </div>
          </div>
          {/* Edit User Dialog */}
          <Dialog
            open={Boolean(editingUser)}
            onClose={handleCloseEditUser}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogContent dividers>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  label="Nombre Completo"
                  size="small"
                  fullWidth
                  value={editedUser.name || ""}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, name: e.target.value })
                  }
                  sx={{ mt: 1 }}
                />
                <TextField
                  label="Correo Electrónico"
                  size="small"
                  fullWidth
                  value={editedUser.email || ""}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, email: e.target.value })
                  }
                  sx={{ mt: 1 }}
                />
                <TextField
                  select
                  label="Rol"
                  size="small"
                  fullWidth
                  value={editedUser.role || ""}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      role: e.target.value as UserRole,
                    })
                  }
                  sx={{ mt: 1 }}
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="agent">Jefe</MenuItem>
                  <MenuItem value="specialist">Operativo</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Área"
                  size="small"
                  fullWidth
                  value={editedUser.area || ""}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      area: e.target.value,
                    })
                  }
                  sx={{ mt: 1 }}
                >
                  {getAllAreas().map((area) => (
                    <MenuItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="País"
                  size="small"
                  fullWidth
                  value={editedUser.country?.id || ""}
                  onChange={(e) => {
                    const selectedCountry = countries?.find(
                      (c) => c.id === e.target.value
                    );
                    setEditedUser({
                      ...editedUser,
                      country: selectedCountry || null,
                    });
                  }}
                  sx={{ mt: 1 }}
                >
                  {countries?.map((c) => (
                    <MenuItem key={c.id || c} value={c.id || c}>
                      {c.country_name || c}
                    </MenuItem>
                  ))}
                </TextField>

                {/* <TextField
                size="small"
                label="Contraseña"
                fullWidth
                type="text"
                value={editedUser.password || ""}
                onChange={(e) => setEditedUser({ ...editedUser, password: e.target.value })}
                sx={{ mt: 1 }}
              /> */}

                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Personas a cargo</InputLabel>
                  <Select
                    multiple
                    value={editedUser.assignableTo || []}
                    label="Personas a cargo"
                    onChange={(e) =>
                      setEditedUser({
                        ...editedUser,
                        assignableTo:
                          typeof e.target.value === "string"
                            ? e.target.value.split(",")
                            : e.target.value,
                      })
                    }
                    renderValue={() => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {editedUser.assignableTo?.map((value) => {
                          const us = users.find(
                            (u) => u.id.toString().trim() == value
                          );
                          return (
                            <Chip
                              key={value}
                              label={us ? us.name : value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Puede recibir de</InputLabel>
                  <Select
                    multiple
                    value={editedUser.receivableFrom || []}
                    label="Puede recibir de"
                    onChange={(e) =>
                      setEditedUser({
                        ...editedUser,
                        receivableFrom:
                          typeof e.target.value === "string"
                            ? e.target.value.split(",")
                            : e.target.value,
                      })
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {editedUser.receivableFrom?.map((value) => {
                          const us = users.find(
                            (u) => u.id.toString().trim() == value
                          );
                          return (
                            <Chip
                              key={value}
                              label={us ? us.name : value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {users.map((u) => (
                      <MenuItem key={u.id} value={`${u.id}`}>
                        {u.name} ({u.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditUser}>Cancelar</Button>
              <Button
                onClick={handleSaveEditedUser}
                variant="contained"
                disabled={isSavingEdit}
                sx={{ backgroundColor: "#1e242b" }}
              >
                {isSavingEdit ? "Guardando..." : "Guardar"}
              </Button>
            </DialogActions>
          </Dialog>
        </CustomTabPanel>

        {/* --- TAB 2: CATEGORIES AND AREAS --- */}
        <CustomTabPanel value={tabValue} index={1}>
          <div className="px-8">
            {/* Categories Section */}
            <Typography variant="h6" className="font-bold text-[#1e242b] mb-4">
              Gestión de Categorías
            </Typography>
            <p className="text-sm text-gray-500 mb-6">
              Organice las áreas operativas por categorías principales.
            </p>

            {/* Add Category Form */}
            <div className="flex gap-4 mb-6 max-w-md">
              <TextField
                label="Nueva Categoría"
                variant="outlined"
                size="small"
                fullWidth
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
                placeholder="Ej: OFICINA"
              />
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={handleAddCategory}
                disabled={!newCategory}
                sx={{ backgroundColor: "#1e242b", whiteSpace: "nowrap" }}
              >
                Agregar
              </Button>
            </div>

            {/* Categories List */}
            <List className="bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto max-w-2xl mb-8">
              {console.log("Rendering categories:", categories)}
              {categories.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No hay categorías configuradas" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      style: { color: '#6b7280', textAlign: 'center' }
                    }} 
                  />
                </ListItem>
              ) : (
                categories.map((category) => (
                <React.Fragment key={category.id}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEditCategory(category)}
                          color="primary"
                        >
                          <Pencil size={18} />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteCategory(category)}
                          color="error"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        editingCategory?.id === category.id ? (
                          <TextField
                            value={editedCategory.nombre}
                            onChange={(e) => setEditedCategory({ nombre: e.target.value })}
                            size="small"
                            variant="outlined"
                            className="w-48"
                          />
                        ) : (
                          category.nombre
                        )
                      }
                      secondary={`${category?.areas?.length} área(s)`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    {editingCategory?.id === category.id && (
                      <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSaveEditCategory}
                          sx={{ minWidth: "auto", px: 2 }}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleCancelEditCategory}
                          sx={{ minWidth: "auto", px: 2 }}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    )}
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              )))}
            </List>

            {/* Areas Section */}
            <Typography variant="h6" className="font-bold text-[#1e242b] mb-4">
              Gestión de Áreas por Categoría
            </Typography>
            <p className="text-sm text-gray-500 mb-6">
              Agregue áreas específicas a cada categoría.
            </p>

            {/* Add Area Form */}
            <div className="flex gap-4 mb-6 max-w-lg">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedCategoryForArea || ""}
                  onChange={(e) => setSelectedCategoryForArea(Number(e.target.value))}
                  label="Categoría"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Nueva Área"
                variant="outlined"
                size="small"
                fullWidth
                value={newArea}
                onChange={(e) => setNewArea(e.target.value.toUpperCase())}
                placeholder="Ej: HELP DESK"
              />
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={handleAddArea}
                disabled={!newArea || selectedCategoryForArea === null}
                sx={{ backgroundColor: "#1e242b", whiteSpace: "nowrap" }}
              >
                Agregar
              </Button>
            </div>

            {/* Areas by Category */}
            {categories?.map((category) => (
              <div key={category.id} className="mb-6">
                <Typography variant="subtitle1" className="font-semibold text-[#1e242b] mb-3">
                  {category.nombre}
                </Typography>
                {category.areas?.length > 0 ? (
                  <List className="bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto max-w-2xl">
                    {category.areas.map((area, index) => {
                      console.log("Rendering area:", area, "with ID:", area.id);
                      return (
                      <React.Fragment key={area.id}>
                        <ListItem
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => {
                                console.log("Delete clicked for area:", area);
                                handleDeleteArea(area);
                              }}
                              color="error"
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={area.name}
                            primaryTypographyProps={{ fontWeight: 500 }}
                          />
                        </ListItem>
                        {index < category.areas.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                      );
                    })}
                  </List>
                ) : (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-w-2xl">
                    <Typography variant="body2" className="text-gray-500 text-center">
                      No hay áreas configuradas para esta categoría
                    </Typography>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CustomTabPanel>

        {/* --- TAB 3: COUNTRIES --- */}
        <CustomTabPanel value={tabValue} index={2}>
          <div className="px-8">
            <Typography variant="h6" className="font-bold text-[#1e242b] mb-4">
              Configuración de Países
            </Typography>
            <p className="text-sm text-gray-500 mb-6">
              Agregue o elimine países disponibles en el sistema.
            </p>

            <div className="flex gap-4 mb-6 max-w-md">
              <TextField
                label="Nuevo País"
                variant="outlined"
                size="small"
                fullWidth
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="Ej: Honduras"
              />
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={handleAddCountry}
                disabled={!newCountry}
                sx={{ backgroundColor: "#1e242b", whiteSpace: "nowrap" }}
              >
                Agregar
              </Button>
            </div>

            <List className="bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto max-w-2xl">
              {countries?.map((country, index) => (
                <React.Fragment key={`${country}-${index}`}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEditCountry(country)}
                          color="primary"
                        >
                          <Settings size={18} />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteCountry(country.id)}
                          color="error"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={country.country_name}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  {index < countries.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </div>
        </CustomTabPanel>

        {/* --- TAB 4: EMAIL CONFIG --- */}
        <CustomTabPanel value={tabValue} index={3}>
          <div className="px-8">
            <Typography variant="h6" className="font-bold text-[#1e242b] mb-4">
              Configuración de Correo Electrónico
            </Typography>
            <p className="text-sm text-gray-500 mb-6">
              Configure el servidor de correo para enviar notificaciones del sistema.
            </p>

            {emailError && <Alert severity="error" className="mb-4">{emailError}</Alert>}
            {emailSuccess && <Alert severity="success" className="mb-4">{emailSuccess}</Alert>}

            {/* Current Config Status */}
            <Paper variant="outlined" className="p-6 mb-8 bg-gray-50/50">
              <Typography variant="subtitle2" className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">
                Estado Actual
              </Typography>
              {emailConfig?.isConfigured ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography variant="body2" className="text-gray-700">
                        <strong>Correo configurado:</strong> {emailConfig.email}
                      </Typography>
                    </div>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleDeleteEmailConfig}
                    >
                      Eliminar Configuración
                    </Button>
                  </div>
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No hay configuración de correo establecida.
                </Typography>
              )}
            </Paper>

            {/* Configure Email Form */}
            <Paper variant="outlined" className="p-6 mb-8 bg-gray-50/50">
              <Typography variant="subtitle2" className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">
                {emailConfig?.isConfigured ? 'Actualizar Configuración' : 'Configurar Correo'}
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <TextField
                  label="Correo Electrónico"
                  size="small"
                  fullWidth
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
                <TextField
                  label="Contraseña"
                  size="small"
                  fullWidth
                  type="password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  placeholder="Contraseña del correo"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="contained"
                  startIcon={<Mail />}
                  onClick={handleSaveEmailConfig}
                  disabled={emailLoading}
                  sx={{ backgroundColor: "#1e242b" }}
                >
                  {emailLoading ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </Paper>

            {/* Test Email */}
            {emailConfig?.isConfigured && (
              <Paper variant="outlined" className="p-6 bg-gray-50/50">
                <Typography variant="subtitle2" className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">
                  Enviar Correo de Prueba
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <TextField
                    label="Destinatario"
                    size="small"
                    fullWidth
                    type="email"
                    value={testEmailForm.to}
                    onChange={(e) => setTestEmailForm({ ...testEmailForm, to: e.target.value })}
                    placeholder="destinatario@ejemplo.com"
                  />
                  <TextField
                    label="Asunto"
                    size="small"
                    fullWidth
                    value={testEmailForm.subject}
                    onChange={(e) => setTestEmailForm({ ...testEmailForm, subject: e.target.value })}
                  />
                </div>
                <TextField
                  label="Mensaje"
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  value={testEmailForm.text}
                  onChange={(e) => setTestEmailForm({ ...testEmailForm, text: e.target.value })}
                  className="mb-4"
                />
                <div className="flex justify-end">
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={handleSendTestEmail}
                    disabled={emailLoading}
                    sx={{ backgroundColor: "#e51b24" }}
                  >
                    {emailLoading ? "Enviando..." : "Enviar Correo de Prueba"}
                  </Button>
                </div>
              </Paper>
            )}
          </div>
        </CustomTabPanel>
      </Paper>
    </div>
  );
};
