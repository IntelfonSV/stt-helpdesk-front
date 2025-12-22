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
import { Save, CheckCircle2 } from "lucide-react";
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

export const TicketForm: React.FC<TicketFormProps> = ({ currentUser }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState("");
  const { emailContent } = EmailHelper();

  const token = localStorage.getItem("token") || undefined;

  interface Country { id: string; country_name: string; }

  const [users, setUsers] = useState<User[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper para obtener string del país
  const getCountryName = (c: any): string => (typeof c === "string" ? c : c?.country_name || "");

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
  const [area, setArea] = useState<TicketArea | "">("");
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.P4);
  const [assignee, setAssignee] = useState("");

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
          apiRequest<string[]>("/areas", "GET", { authToken: token }),
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

    fetchData();
  }, [token]);

  // Inicializar país según rol
  useEffect(() => {
    if (currentUser && !country && countries.length > 0) {
      if (currentUser.role === "admin") {
        setCountry(countries[0].country_name);
      } else {
        setCountry(currentUser.country);
      }
    }
  }, [currentUser, country, countries]);

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
      const payload = {
        subject,
        /*type, // NUEVO: lo estás enviando al backend*/
        area,
        priority,
        description, // NUEVO: detalle separado del asunto
        requesterId: currentUser.id,
        assigneeId: assignee,
        country,
        entryDate,
        dueDate: new Date(dueDate).toISOString(),
        status: TicketStatus.IN_PROGRESS,
      };

      const res = await apiRequest<CreateTicketResponse>("/tickets", "POST", {
        authToken: token,
        body: payload,
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
            to: users?.find(u => u.id === assignee)?.email || "",
            cc: currentUser.email,
            subject: `Nuevo ticket asignado: ${subject}`,
            html: emailContent({
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
    setArea("");
    setPriority(TicketPriority.P4);
    setAssignee("");
    setCreatedTicketId("");
    setIsSuccess(false);
    // Se mantiene el país actual
  };

  // Asignables: agentes / especialistas del país seleccionado
  const availableAssignees = users?.filter(
    (u: any) =>
      (u.role === "agent" || u.role === "specialist") &&
      getCountryName(u.country) === country &&
      (area ? u.area === area : true)
  );

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
              value={area}
              onChange={(e) => {
                setArea(e.target.value as TicketArea);
                setAssignee("");
              }}
              disabled={isSubmitting || loading}
            >
              {areas.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
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
                availableAssignees.length === 0
                  ? "No hay usuarios disponibles en el país seleccionado."
                  : ""
              }
              disabled={isSubmitting || loading}
            >
              {availableAssignees?.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.area})
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
              {isSubmitting ? "Procesando..." : "Crear Ticket"}
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
};
