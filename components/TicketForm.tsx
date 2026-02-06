import React, { useState, useEffect, useMemo } from "react";
import {
  Paper,
  TextField,
  MenuItem,
  Button,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Save, CheckCircle2, Upload, X, File } from "lucide-react";
import { TicketPriority, User, TicketArea, TicketStatus } from "../types";

import { calculateSLA } from "../utils";
import { apiRequest } from "../lib/apiClient";
import EmailHelper from "./helpers/EmailHelper";


interface TicketFormProps {
  currentUser: User | null;
}

interface CreateTicketResponse {
  id: number;
}

interface Area {
  id: number;
  name: string;
}

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/zip': ['.zip'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'video/mp4': ['.mp4'],
};

const FORBIDDEN_EXTENSIONS = ['.exe'];

interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

export const TicketForm: React.FC<TicketFormProps> = ({ currentUser }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState("");
  const { emailAsignado } = EmailHelper();

  const token = localStorage.getItem("token") || undefined;

  interface Country { id: string; country_name: string; }

  const [users, setUsers] = useState<User[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Helper para obtener string del país
  const getCountryName = (c: any): string => (typeof c === "string" ? c : c?.country_name || "");

  // File validation functions
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo ${file.name} excede el tamaño máximo de 10MB`;
    }

    // Check forbidden extensions
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (FORBIDDEN_EXTENSIONS.includes(fileExtension)) {
      return `El archivo ${file.name} tiene un formato no permitido`;
    }

    // Check allowed file types
    const isAllowed = Object.values(ALLOWED_FILE_TYPES).flat().includes(fileExtension);
    if (!isAllowed) {
      return `El archivo ${file.name} tiene un formato no permitido. Formatos permitidos: PDF, Word, Excel, ZIP, PNG, JPG, MP3, WAV, MP4`;
    }

    return null;
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        newFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
    });

    if (errors.length > 0) {
      setFileError(errors.join('. '));
    } else {
      setFileError('');
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    if (uploadedFiles.length <= 1) {
      setFileError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Países disponibles según el usuario
  const availableCountries = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") {
      return countries.map((c) => c.country_name);
    }
    return currentUser.country ? [getCountryName(currentUser.country)] : [];
  }, [currentUser, countries]);

  // Estado del formulario
  const [country, setCountry] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState(""); // NUEVO
  const [type, setType] = useState<string>("request"); // NUEVO (puedes ajustar valores al backend)
  const [area, setArea] = useState<number | "">("");
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.P4);
  const [assignee, setAssignee] = useState("");
  const [assignees, setAssignees] = useState<User[]>([]);

  // Fechas
  const [entryDate] = useState(new Date().toISOString());
  const [dueDate, setDueDate] = useState("");

  // Cargar usuarios y áreas desde API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [usersRes, areasRes, countriesRes] = await Promise.all([
          apiRequest<User[]>("/users", "GET", { authToken: token }),
          apiRequest<Area[]>("/areas", "GET", { authToken: token }),
          apiRequest<Country[]>("/countries", "GET", { authToken: token }),
        ]);

        setUsers(usersRes);
        setAreas(areasRes);
        setCountries(countriesRes);
      } catch (e) {
        console.error("Error fetching data:", e);
        setError("Error al cargar datos del servidor.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // Inicializar país según rol
  useEffect(() => {
    if (currentUser && !country && countries.length > 0) {
      if (currentUser.role === "admin") {
        setCountry(countries[0].country_name);
      } else {
        setCountry(currentUser.country.country_name);
      }
    }
  }, [currentUser, countries]);

  // Recalcular SLA cuando cambia prioridad
  useEffect(() => {
    const slaISO = calculateSLA(entryDate, priority);
    const formattedSLA = slaISO.slice(0, 16); // yyyy-MM-ddTHH:mm
    setDueDate(formattedSLA);
  }, [priority, entryDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add ticket data
      formData.append('subject', subject);
      formData.append('priority', priority);
      formData.append('description', description);
      formData.append('requesterId', currentUser.id.toString());
      formData.append('assigneeId', assignee);
      formData.append('country', country);
      formData.append('entryDate', entryDate);
      formData.append('dueDate', new Date(dueDate).toISOString());
      formData.append('status', TicketStatus.IN_PROGRESS);

      // Add files - use standard approach
      uploadedFiles.forEach((uploadedFile) => {
        formData.append('files', uploadedFile.file);
      });

      // Debug: Log FormData contents
      console.log('Uploading files:', uploadedFiles.length);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value && typeof value === 'object' && 'name' in value && 'size' in value) {
          console.log(key, 'File:', value.name, value.size, value.type);
        } else {
          console.log(key, value);
        }
      }

      const res = await apiRequest<CreateTicketResponse>("/tickets", "POST", {
        authToken: token,
        body: formData,
        headers: {
          // Don't set Content-Type header when using FormData
          // Let the browser set it with the correct boundary
        },
      });

      notify();
      setCreatedTicketId(res.id.toString());
      setIsSubmitting(false);
      setIsSuccess(true);
      
    } catch (err) {
      console.error("Error creando ticket:", err);
      setError("Error al crear el ticket. Inténtelo de nuevo.");
      setIsSubmitting(false);
    }
  };


  const notify = async () => {
            // Enviar correo de notificación
      try {

        
        
        await apiRequest('/email/send', 'POST', {
          authToken: token,
          body: {
            to: `${users?.find(u => u.id === assignee)?.email || ""}`,
            subject: `Nuevo ticket asignado: ${subject}`,
            html: emailAsignado({
                        asignBy: currentUser.name,
                        assignTo: users?.find(u => u.id === assignee)?.name || "N/A",

                        dueDate: dueDate,
                        subject: subject,
                        description: description
                      })
          }
        });
      } catch (emailErr) {
        console.error("Error enviando correo:", emailErr);
      }
    
  }

  const handleReset = () => {
    setSubject("");
    setDescription("");
    setArea(""); // Reset to empty string (number | "")
    setPriority(TicketPriority.P4);
    setAssignee("");
    setCreatedTicketId("");
    setIsSuccess(false);
    setUploadedFiles([]);
    setFileError("");
    // Se mantiene el país actual
  };

  // Asignables: agentes / especialistas del país seleccionado


  useEffect(() => {
    console.log("currentUser: ", currentUser);
    console.log("users: ", users);
    console.log("country: ", country);
    console.log("area: ", area);
    const availableAssignees = users?.filter(
    (u: any) =>
      u.receivableFrom.includes(`${currentUser.id}`) && 
      getCountryName(u.country) === country &&
      (area ? u.area.id == area : false)
  );

  console.log( "availableAssignees: ",availableAssignees);
  setAssignees(availableAssignees);
  }, [country, area, users]);

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
        <Paper className="p-12 text-center border border-green-100 bg-green-50/50">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-[#1e242b] mb-2">
            ¡Ticket Creado!
          </h2>
          <p className="text-gray-600 mb-4 text-lg">
            Tu solicitud ha sido registrada correctamente.
          </p>

          <div className="bg-white inline-block px-6 py-3 rounded-lg border border-dashed border-green-300 mb-8 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
              Correlativo
            </p>
            <p className="text-3xl font-mono font-bold text-[#e51b24]">
              {createdTicketId}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outlined" onClick={handleReset}>
              Volver
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReset}
              sx={{ backgroundColor: "#e51b24" }}
            >
              Crear Otro Ticket
            </Button>
          </div>
        </Paper>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-12">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#1e242b]">
          Ingresar Solicitud
        </h1>
        <p className="text-gray-500 mt-1">
          Complete los datos para generar un nuevo ticket.
        </p>
      </div>

      <Paper className="p-8 border border-gray-200 shadow-lg rounded-2xl">
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-gray-500">
            <CircularProgress size={20} />
            <span>Cargando datos...</span>
          </div>
        )}

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección 1: Detalles */}
          <div className="space-y-5">
            <Typography
              variant="h6"
              className="text-[#1e242b] font-bold border-b border-gray-100 pb-2"
            >
              1. Detalles del Requerimiento
            </Typography>

            <TextField
              select
              label="País"
              fullWidth
              required
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setAssignee("");
              }}
              disabled={availableCountries.length <= 1}
              helperText={
                availableCountries.length <= 1
                  ? "Su usuario solo puede crear tickets para su país asignado."
                  : "Seleccione el país donde se atenderá el ticket."
              }
            >
              {availableCountries.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Asunto"
              fullWidth
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Título corto del requerimiento..."
              disabled={isSubmitting || loading}
            />

            <TextField
              label="Descripción Detallada"
              fullWidth
              multiline
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa detalladamente la tarea o problema..."
              disabled={isSubmitting || loading}
            />

            {/* File Upload Section */}
            <div className="space-y-3">
              <Typography variant="subtitle2" className="text-[#1e242b] font-medium">
                Archivos Adjuntos
              </Typography>
              
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  Arrastra archivos aquí o{' '}
                  <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                    haz clic para seleccionar
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.mp3,.wav,.mp4"
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">
                  Formatos permitidos: PDF, Word, Excel, ZIP, PNG, JPG, MP3, WAV, MP4 (Máx. 10MB por archivo)
                </p>
              </div>

              {/* File Error Display */}
              {fileError && (
                <Alert severity="error" className="mt-2">
                  {fileError}
                </Alert>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Typography variant="subtitle2" className="text-[#1e242b]">
                    Archivos seleccionados ({uploadedFiles.length})
                  </Typography>
                  {uploadedFiles.map((uploadedFile) => (
                    <div
                      key={uploadedFile.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={() => removeFile(uploadedFile.id)}
                        disabled={isSubmitting}
                        startIcon={<X className="h-4 w-4" />}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/*
            <TextField
            select
              label="Tipo de Ticket"
              fullWidth
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSubmitting || loading}
              helperText="Selecciona el tipo general de solicitud."
              >
              <MenuItem value="request">Requerimiento</MenuItem>
              <MenuItem value="incident">Incidencia</MenuItem>
              <MenuItem value="maintenance">Mantenimiento</MenuItem>
            </TextField>
            */}

            <TextField
              select
              label="Área Solicitada"
              fullWidth
              required
              value={area || ""}
              onChange={(e) => {
                setArea(Number(e.target.value));
                setAssignee("");
              }}
              disabled={isSubmitting || loading}
            >
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {/* Sección 2: Clasificación */}
          <div className="space-y-5">
            <Typography
              variant="h6"
              className="text-[#1e242b] font-bold border-b border-gray-100 pb-2 pt-4"
            >
              2. Clasificación y Tiempos
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                select
                label="Nivel de Prioridad (SLA)"
                fullWidth
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                disabled={isSubmitting || loading}
              >
                {Object.values(TicketPriority).map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="datetime-local"
                label="Fecha de Entrega Estimada"
                fullWidth
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Calculado automáticamente, modificable."
                disabled={isSubmitting || loading}
              />
            </div>

            <Alert
              severity="info"
              className="bg-blue-50 text-blue-900 border border-blue-100"
            >
              SLA calculado en horario hábil (Lun-Vie). Puede ajustar la fecha
              de entrega manualmente si es necesario.
            </Alert>
          </div>

          {/* Sección 3: Asignación */}
          <div className="space-y-5">
            <Typography
              variant="h6"
              className="text-[#1e242b] font-bold border-b border-gray-100 pb-2 pt-4"
            >
              3. Responsable
            </Typography>

            <TextField
              select
              label="Asignar A"
              fullWidth
              required
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              helperText={
                assignees.length === 0
                  ? "No hay usuarios disponibles en el país seleccionado."
                  : ""
              }
              disabled={isSubmitting || loading}
            >
              {assignees?.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.area.name})
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div className="pt-8">
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={
                isSubmitting ||
                loading ||
                !subject ||
                !description ||
                !area ||
                !assignee ||
                !country
              }
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Save size={18} />
                )
              }
              sx={{ backgroundColor: "#e51b24", height: "56px" }}
            >
              {isSubmitting ? (
                <span>Procesando...</span>
              ) : (
                "Crear Ticket"
              )}
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
};
