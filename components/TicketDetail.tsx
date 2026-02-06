import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Button,
  Divider,
  Avatar,
  TextField,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Edit,
  AlertCircle,
  Save,
  Download,
  File,
  Image,
  FileText,
  Video,
  Music,
  Archive,
} from "lucide-react";
import { TicketStatus, User } from "../types";
import { formatDate } from "../utils";
import { apiRequest } from "../lib/apiClient";
import EmailHelper from "./helpers/EmailHelper";

interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: number;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  entryDate: string;
  dueDate: string;
  requesterId: number;
  assigneeId: number;
  country: string;
  area: {
    id: number;
    name: string;
  };
  requester: {
    id: number;
    name: string;
    email: string;
  };
  assignee: {
    id: number;
    name: string;
    email: string;
  };
  attachments?: Attachment[];
}

interface TicketDetailProps {
  currentUser: User | null;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ currentUser }) => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const token = localStorage.getItem("token") || undefined;
  const { emailAsignado, emailSeguimiento, emailFinalizado, emailCancelado } = EmailHelper();

  const getTicket = () => {
    apiRequest<Ticket>(`/tickets/${id}`, "GET", { authToken: token }).then(
      (res) => {
        setTicket(res);
      }
    );
  };

  // Helper function to get file icon based on MIME type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="h-5 w-5 text-blue-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (mimeType.includes('document') || mimeType.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('xlsx') || mimeType.includes('xls')) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
      return <Archive className="h-5 w-5 text-yellow-600" />;
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    } else if (mimeType.includes('text')) {
      return <FileText className="h-5 w-5 text-gray-600" />;
    } else {
      return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file download
  const handleDownloadFile = async (attachment: Attachment) => {
    try {
      // API_BASE_URL already includes /api/v1/, so just add the endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.1.68:3001/api/v1';
      const response = await fetch(`${API_BASE_URL}/tickets/attachments/${attachment.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();
      console.log('Blob descargado:', {
        size: blob.size,
        type: blob.type
      });

      const url = window.URL.createObjectURL(blob);
      console.log('URL creada:', url);
      
      // Para imágenes: abrir en nueva pestaña
      if (attachment.mimeType.startsWith('image/')) {
        window.open(url, '_blank');
      } else {
        // Para otros archivos: descargar
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar el archivo. Inténtelo de nuevo.');
    }
  };

  useEffect(() => {
    getTicket();
  }, [token]);

  const navigate = useNavigate();

  // State Management
  // currentStatus: Represents the committed status of the ticket (affects UI visibility)
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>(
    ticket?.status || TicketStatus.WAITING
  );

  // pendingStatus: Represents the value selected in the dropdown, waiting to be saved
  const [pendingStatus, setPendingStatus] = useState<TicketStatus>(
    ticket?.status || TicketStatus.WAITING
  );

  const [newDueDate, setNewDueDate] = useState<string>(
    ticket?.dueDate ? ticket.dueDate.slice(0, 16) : ""
  );
  const [actionLog, setActionLog] = useState("");
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  // Reset state if ticket ID changes (navigation between tickets)
  useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status);
      setPendingStatus(ticket.status);
      setActionLog("");
    }
  }, [ticket?.id, ticket]);

  // Update elapsed time counter every second
  useEffect(() => {
    if (!ticket) return;

    const updateElapsedTime = () => {
      const now = new Date();
      const created = new Date(ticket.entryDate);
      const diff = now.getTime() - created.getTime();
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      const remainingHours = hours % 24;
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      
      let timeString = "";
      if (days > 0) {
        timeString = `${days}d ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
      } else if (hours > 0) {
        timeString = `${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
      } else if (minutes > 0) {
        timeString = `${remainingMinutes}m ${remainingSeconds}s`;
      } else {
        timeString = `${remainingSeconds}s`;
      }
      
      setElapsedTime(timeString);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [ticket]);

  if (!ticket || !currentUser) return <div>Cargando...</div>;

  const isAssignee = currentUser.id === ticket.assigneeId;
  const isRequester = currentUser.id === ticket.requesterId;

  // Roles check
  const isAdmin = currentUser.role === "admin";
  const isAgent = currentUser.role === "agent"; // Jefes
  // Specialist unused variable removed or kept if needed for logic extension
  // const isSpecialist = currentUser.role === 'specialist';

  // Capabilities
  // Date Editing: Only Admin or Agent (Jefes)
  const canEditDate = isAdmin || isAgent;

  // Tracking: Admin, Agent, or the Assigned Specialist
  const canAddTracking = isAdmin || isAgent || isAssignee;

  // Cancel: Only Requester
  const canCancel =
    isRequester &&
    currentStatus !== TicketStatus.CANCELLED &&
    currentStatus !== TicketStatus.RESOLVED;

  // Handler for saving the tracking action
  const handleSaveAction = () => {
    if (!actionLog) return;

    apiRequest(`/tickets/${id}/status`, "PUT", {
      authToken: token,
      body: { userId: currentUser.id, status: pendingStatus, actionLog },
    }).then((res) => {
      getTicket();
      
      // Send email notification for tracking
      notifyTracking(pendingStatus, actionLog);
      
      // Send email notification for finalization if status is RESOLVED
      if (pendingStatus === TicketStatus.RESOLVED) {
        notifyFinalized();
      }
    });

    // Commit the pending status to current status
    setCurrentStatus(pendingStatus);

    // Reset log but keep status
  };

  const handleDateChange = () => {
    const isoDate = new Date(newDueDate).toISOString();
    apiRequest(`/tickets/${id}/duedate`, "PATCH", {
      authToken: token,
      body: { newDate: isoDate },
    }).then(() => {
      getTicket();
    });
    setIsEditingDate(false);
  };

  // Email notification functions
  const notifyTracking = async (status: TicketStatus, actionLog: string) => {
    try {
      await apiRequest('/email/send', 'POST', {
        authToken: token,
        body: {
          to: `${ticket?.requester?.email || ""}`,
          subject: `Seguimiento de ticket: ${ticket?.id}`,
          html: emailSeguimiento({
            asignBy: currentUser.name,
            assignTo: ticket?.assignee?.name || "N/A",
            correlativo: ticket?.id || "N/A",
            fechaSeguimiento: new Date().toISOString(),
            estado: status,
            subject: ticket?.subject || "N/A",
            accionRealizada: actionLog
          })
        }
      });
    } catch (emailErr) {
      console.error("Error enviando correo de seguimiento:", emailErr);
    }
  };

  const notifyFinalized = async () => {
    try {
      await apiRequest('/email/send', 'POST', {
        authToken: token,
        body: {
          to: `${ticket?.requester?.email || ""}`,
          subject: `Ticket finalizado: ${ticket?.id}`,
          html: emailFinalizado({
            correlativo: ticket?.id || "N/A",
            asignBy: ticket?.requester?.name || "N/A",
            finalizadoPor: currentUser.name,
            fechaCierre: new Date().toISOString(),
            diasAtraso: "0", // Calculate if needed
            subject: ticket?.subject || "N/A",
            resolucion: actionLog || "Ticket finalizado"
          })
        }
      });
    } catch (emailErr) {
      console.error("Error enviando correo de finalización:", emailErr);
    }
  };

  const notifyCancelled = async () => {
    try {
      await apiRequest('/email/send', 'POST', {
        authToken: token,
        body: {
          to: `${ticket?.requester?.email || ""}`,
          subject: `Ticket cancelado: ${ticket?.id}`,
          html: emailCancelado({
            correlativo: ticket?.id || "N/A",
            asignBy: ticket?.requester?.name || "N/A",
            canceladoPor: currentUser.name,
            fechaCancelacion: new Date().toISOString(),
            subject: ticket?.subject || "N/A",
            motivoCancelacion: "Ticket cancelado por el solicitante"
          })
        }
      });
    } catch (emailErr) {
      console.error("Error enviando correo de cancelación:", emailErr);
    }
  };

  // Handler for the global Cancel button (Requester action)
  const handleCancelTicket = () => {
    if (window.confirm("¿Está seguro de cancelar este ticket?")) {
      apiRequest(`/tickets/${id}/cancel`, "PATCH", {
        authToken: token,
        body: { reason: "Ticket cancelado por el solicitante" },
      }).then(() => {
        getTicket();
        
        // Send email notification for cancellation
        notifyCancelled();
      });
      setCurrentStatus(TicketStatus.CANCELLED);
      setPendingStatus(TicketStatus.CANCELLED);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/tickets")}
          className="text-gray-500 hover:text-gray-900"
        >
          Volver
        </Button>
            <div className="flex-1">
              <div className="flex items-start sm:items-center gap-3">
                <Typography variant="h4" className="font-bold text-[#1e242b] bg-gradient-to-r from-[#1e242b] to-[#2a3f5f] bg-clip-text text-transparent">
                  {ticket.id}: {ticket.subject}
                </Typography>
                <Chip
                  label={currentStatus}
                  color={
                    currentStatus === TicketStatus.RESOLVED
                      ? "success"
                      : currentStatus === TicketStatus.CANCELLED
                      ? "error"
                      : "primary"
                  }
                  variant="outlined"
                  className="shadow-sm"
                />
              </div>
            </div>
        {/* Cancel Button: Only Requester can cancel */}
        {canCancel && (
          <Button variant="outlined" color="error" onClick={handleCancelTicket}>
            Cancelar Ticket
          </Button>
        )}
      </div>

      <Grid container spacing={4}>
        <Grid item={true} xs={12} lg={8}>
          <Paper className="p-6 border border-gray-200 shadow-lg rounded-xl mb-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-300">
            <Typography
              variant="h6"
              className="font-bold mb-4 flex items-center gap-2 text-[#1e242b]"
            >
              <Tag size={20} className="text-[#e51b24] drop-shadow-sm" />
              <span className="bg-gradient-to-r from-[#1e242b] to-[#2a3f5f] bg-clip-text text-transparent">Descripción de la Solicitud</span>
            </Typography>
            <Typography
              variant="body1"
              className="text-gray-700 whitespace-pre-wrap leading-relaxed"
            >
              {ticket.description || "Sin descripción detallada."}
            </Typography>
          </Paper>

          {/* Attachments Section */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Paper className="p-6 border border-gray-200 shadow-lg rounded-xl mb-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-300">
              <Typography
                variant="h6"
                className="font-bold mb-4 flex items-center gap-2 text-[#1e242b]"
              >
                <File size={20} className="text-[#e51b24] drop-shadow-sm" />
                <span className="bg-gradient-to-r from-[#1e242b] to-[#2a3f5f] bg-clip-text text-transparent">Archivos Adjuntos</span>
                <Chip 
                  label={ticket.attachments.length} 
                  size="small" 
                  variant="outlined" 
                  className="ml-2 text-xs"
                />
              </Typography>
              <div className="space-y-3">
                {ticket.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(attachment.mimeType)}
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)} • {formatDate(attachment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Download size={16} />}
                      onClick={() => handleDownloadFile(attachment)}
                      className="text-[#e51b24] border-[#e51b24] hover:bg-[#e51b24] hover:text-white transition-colors duration-200"
                    >
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            </Paper>
          )}

          {/* Actions / Tracking Log */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <Typography variant="h6" className="font-bold text-[#1e242b]">
                Seguimiento y Acciones
              </Typography>
            </div>

            {/* 
                   Form Visibility Logic:
                   Only show if the CURRENT confirmed status is not resolved/cancelled.
                   This allows users to select 'Finalizado' in the dropdown (pendingStatus) 
                   without the form disappearing immediately.
                */}
            {canAddTracking &&
              currentStatus !== TicketStatus.RESOLVED &&
              currentStatus !== TicketStatus.CANCELLED && (
                <Paper className="p-4 border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Typography
                    variant="subtitle2"
                    className="mb-2 font-bold text-gray-700 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Registrar Acción Realizada
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Describa la acción realizada..."
                    value={actionLog}
                    onChange={(e) => setActionLog(e.target.value)}
                    className="bg-white mb-3"
                  />

                  <div className="flex justify-between items-center mt-8">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Actualizar Estado</InputLabel>
                      <Select
                        value={pendingStatus}
                        label="Actualizar Estado"
                        onChange={(e) =>
                          setPendingStatus(e.target.value as TicketStatus)
                        }
                      >
                        {Object.values(TicketStatus).map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      startIcon={<Save size={16} />}
                      onClick={handleSaveAction}
                      disabled={!actionLog}
                      sx={{ backgroundColor: "#e51b24" }}
                      className="shadow-md hover:shadow-lg transition-shadow duration-200"
                    >
                      Registrar y Guardar
                    </Button>
                  </div>
                  {/* UX Hint: Show warning if user selected a closing status but hasn't saved yet */}
                  {(pendingStatus === TicketStatus.RESOLVED ||
                    pendingStatus === TicketStatus.CANCELLED) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200 shadow-sm">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span className="font-medium">
                        Atención: Al guardar, el ticket se cerrará y no podrá
                        agregar más acciones.
                      </span>
                    </div>
                  )}
                </Paper>
              )}

            {/* History List */}
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  Sys
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {formatDate(ticket.entryDate)}
                  </p>
                  <p className="text-sm font-medium text-gray-700">Ticket ingresado al sistema.</p>
                </div>
              </div>
              {ticket.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex gap-4 p-4 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* <Avatar sx={{ bgcolor: '#1e242b', width: 32, height: 32 }}>{action.user.charAt(0)}</Avatar> */}
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                  <Avatar sx={{ width: 32, height: 32, className: 'shadow-sm' }}>{action.userNameSnapshot?.charAt(0) || 'U'}</Avatar>

                      <Typography variant="subtitle2" className="font-bold text-gray-800">
                        {action.userNameSnapshot}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 font-medium">
                        {formatDate(action.date)}
                      </Typography>
                    </div>
                    <Typography variant="body2" className="text-gray-700 mt-1 leading-relaxed">
                      {action.action}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Grid>

        <Grid item={true} xs={12} lg={4}>
          <Paper className="p-6 border border-gray-200 shadow-lg rounded-xl space-y-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-300">
            <div>
              <Typography
                variant="subtitle2"
                className="uppercase text-xs font-bold text-gray-500 mb-2"
              >
                Detalles Operativos
              </Typography>
              <div className="space-y-4">
                <div className="flex items-start sm:items-center gap-3">
                  <Clock size={18} className="text-gray-400" />
                  <div className="w-full">
                    <p className="text-xs text-gray-500">Prioridad</p>
                    <p className="font-medium text-sm">{ticket.priority}</p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center gap-3">
                  <Tag size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Área</p>
                    <p className="font-medium text-sm">{ticket.assignee?.area?.name}</p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div className="w-full">
                    <p className="text-xs text-gray-500">Fecha Ingreso</p>
                    <p className="font-medium text-sm">
                      {formatDate(ticket.entryDate)}
                    </p>
                    <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-xs font-bold text-blue-700">
                          Tiempo transcurrido:
                        </p>
                      </div>
                      <p className="text-sm font-bold text-blue-900 mt-1">
                        {elapsedTime}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-[#e51b24] mt-1" />
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        Fecha Entrega (Deadline)
                      </p>
                      {canEditDate && (
                        <button
                          onClick={() => setIsEditingDate(!isEditingDate)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </div>
                    {isEditingDate ? (
                      <div className="flex flex-col sm:flex-row gap-1 mt-1">
                        <input
                          type="datetime-local"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="border rounded px-1 text-sm w-full"
                        />
                        <button
                          onClick={handleDateChange}
                          className="bg-green-500 text-white px-2 rounded text-xs"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <p className="font-medium text-sm text-[#e51b24]">
                        {formatDate(ticket.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Divider />

            <div>
              <Typography
                variant="subtitle2"
                className="uppercase text-xs font-bold text-gray-500 mb-3"
              >
                Involucrados
              </Typography>
              <div className="space-y-4">
                <div className="flex items-start sm:items-center gap-3">
                  <Avatar sx={{ width: 32, height: 32 }}>{ticket.requester?.name?.charAt(0) || 'U'}</Avatar>
                  <div>
                    <p className="text-xs text-gray-500">Solicitante</p>
                    <p className="font-medium text-sm">
                      {ticket.requester.name}
                    </p>
                    <p className="text-xs text-gray-400">{ticket.country}</p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center gap-3">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#e51b24' }}>{ticket.assignee?.name?.charAt(0) || 'U'}</Avatar>
                  <div>
                    <p className="text-xs text-gray-500">Responsable</p>
                    <p className="font-medium text-sm">
                      {ticket.assignee.name}
                    </p>
                    <p className="text-xs text-gray-400">{ticket.area}</p>
                  </div>
                </div>
              </div>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};
