import React, { useState, useEffect, useMemo } from "react";
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
  Alert,
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
  User as UserIcon,
  CheckCircle2,
  XCircle,
  ClipboardList,
  MessageSquare,
  Paperclip,
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

interface TicketAction {
  id: number;
  ticketId: string;
  userId: number;
  userNameSnapshot?: string;
  action: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  entryDate: string;
  dueDate: string;
  completionDate?: string | null;
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
    area?: {
      id: number;
      name: string;
    };
  };
  attachments?: Attachment[];
  actions: TicketAction[];
  updatedAt?: string;
}

interface TicketDetailProps {
  currentUser: User | null;
}

const getStatusChipProps = (status: TicketStatus | string) => {
  if (
    status === TicketStatus.RESOLVED ||
    status === "Finalizado"
  ) {
    return {
      color: "success" as const,
      icon: <CheckCircle2 size={14} />,
      label: status,
    };
  }

  if (
    status === TicketStatus.CANCELLED ||
    status === "Cancelado"
  ) {
    return {
      color: "error" as const,
      icon: <XCircle size={14} />,
      label: status,
    };
  }

  if (status === TicketStatus.WAITING) {
    return {
      color: "warning" as const,
      icon: <Clock size={14} />,
      label: status,
    };
  }

  return {
    color: "primary" as const,
    icon: <ClipboardList size={14} />,
    label: status,
  };
};

const infoCardClass =
  "p-6 border border-gray-200 shadow-sm rounded-2xl bg-white";
const sectionTitleClass =
  "font-bold mb-4 flex items-center gap-2 text-[#1e242b]";

export const TicketDetail: React.FC<TicketDetailProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || undefined;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState("");
  const [savingAction, setSavingAction] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { emailSeguimiento, emailFinalizado, emailCancelado } = EmailHelper();

  const [currentStatus, setCurrentStatus] = useState<TicketStatus>(
    TicketStatus.WAITING,
  );
  const [pendingStatus, setPendingStatus] = useState<TicketStatus>(
    TicketStatus.WAITING,
  );
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [actionLog, setActionLog] = useState("");
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  const getTicket = async () => {
    try {
      setLoading(true);
      setScreenError("");
      const res = await apiRequest<Ticket>(`/tickets/${id}`, "GET", {
        authToken: token,
      });
      setTicket(res);
    } catch (error) {
      console.error("Error cargando ticket:", error);
      setScreenError("No fue posible cargar el detalle del ticket.");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-green-500" />;
    }
    if (mimeType.startsWith("video/")) {
      return <Video className="h-5 w-5 text-purple-500" />;
    }
    if (mimeType.startsWith("audio/")) {
      return <Music className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.includes("document") || mimeType.includes("word")) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("xlsx") ||
      mimeType.includes("xls")
    ) {
      return <FileText className="h-5 w-5 text-green-600" />;
    }
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar")
    ) {
      return <Archive className="h-5 w-5 text-yellow-600" />;
    }
    if (
      mimeType.includes("powerpoint") ||
      mimeType.includes("presentation")
    ) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    }
    if (mimeType.includes("text")) {
      return <FileText className="h-5 w-5 text-gray-600" />;
    }
    return <File className="h-5 w-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleDownloadFile = async (attachment: Attachment) => {
    try {
      setDownloadingId(attachment.id);

      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://172.16.1.68:3001/api/v1";

      const response = await fetch(
        `${API_BASE_URL}/tickets/attachments/${attachment.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error al descargar el archivo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (attachment.mimeType.startsWith("image/")) {
        window.open(url, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando archivo:", error);
      alert("Error al descargar el archivo. Inténtelo de nuevo.");
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    getTicket();
  }, [id, token]);

  useEffect(() => {
    if (!ticket) return;

    setCurrentStatus(ticket.status);
    setPendingStatus(ticket.status);
    setActionLog("");
    setNewDueDate(ticket.dueDate ? ticket.dueDate.slice(0, 16) : "");
  }, [ticket]);

  useEffect(() => {
    if (!ticket) return;

    const isClosedStatus = (status: TicketStatus | string) => {
      return (
        status === TicketStatus.RESOLVED ||
        status === TicketStatus.CANCELLED ||
        status === "Finalizado" ||
        status === "Cancelado"
      );
    };

    const computeElapsedTime = (start: Date, end: Date) => {
      const diff = end.getTime() - start.getTime();

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

    const created = new Date(ticket.entryDate);

    if (isClosedStatus(ticket.status)) {
      const endIso = ticket.completionDate || ticket.updatedAt;
      const end = endIso ? new Date(endIso) : new Date();
      computeElapsedTime(created, end);
      return;
    }

    const updateElapsedTime = () => {
      computeElapsedTime(created, new Date());
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [ticket]);

  const isClosedUIStatus = (status: TicketStatus | string) => {
    return (
      status === TicketStatus.RESOLVED ||
      status === TicketStatus.CANCELLED ||
      status === "Finalizado" ||
      status === "Cancelado"
    );
  };

  const closedAtIso = useMemo(() => {
    return (
      ticket?.completionDate ||
      ticket?.updatedAt ||
      ticket?.actions?.[0]?.date ||
      null
    );
  }, [ticket]);

  const statusChip = getStatusChipProps(currentStatus);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <Paper className="p-8 border border-gray-200 rounded-2xl">
          <Typography className="text-gray-600">Cargando ticket...</Typography>
        </Paper>
      </div>
    );
  }

  if (screenError || !ticket || !currentUser) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <Paper className="p-8 border border-gray-200 rounded-2xl space-y-4">
          <Typography variant="h6" className="font-bold text-[#1e242b]">
            Detalle de ticket
          </Typography>
          <Alert severity="error">
            {screenError || "No fue posible mostrar la información del ticket."}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate("/tickets")}
          >
            Volver
          </Button>
        </Paper>
      </div>
    );
  }

  const isAssignee = currentUser.id === ticket.assigneeId;
  const isRequester = currentUser.id === ticket.requesterId;
  const isAdmin = currentUser.role === "admin";
  const isAgent = currentUser.role === "agent";

  const canEditDate = isAdmin || isAgent;
  const canAddTracking = isAdmin || isAgent || isAssignee;
  const canCancel =
    isRequester &&
    currentStatus !== TicketStatus.CANCELLED &&
    currentStatus !== TicketStatus.RESOLVED;

  const handleSaveAction = async () => {
    if (!actionLog.trim()) return;

    try {
      setSavingAction(true);

      await apiRequest(`/tickets/${id}/status`, "PUT", {
        authToken: token,
        body: {
          userId: currentUser.id,
          status: pendingStatus,
          actionLog,
        },
      });

      await getTicket();
      await notifyTracking(pendingStatus, actionLog);

      if (pendingStatus === TicketStatus.RESOLVED) {
        await notifyFinalized(actionLog);
      }

      setCurrentStatus(pendingStatus);
      setActionLog("");
    } catch (error) {
      console.error("Error guardando acción:", error);
      alert("No fue posible guardar la acción.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleDateChange = async () => {
    try {
      setSavingDate(true);
      const isoDate = new Date(newDueDate).toISOString();

      await apiRequest(`/tickets/${id}/duedate`, "PATCH", {
        authToken: token,
        body: { newDate: isoDate },
      });

      await getTicket();
      setIsEditingDate(false);
    } catch (error) {
      console.error("Error actualizando fecha:", error);
      alert("No fue posible actualizar la fecha de entrega.");
    } finally {
      setSavingDate(false);
    }
  };

  const notifyTracking = async (status: TicketStatus, log: string) => {
    try {
      await apiRequest("/email/send", "POST", {
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
            accionRealizada: log,
          }),
        },
      });
    } catch (emailErr) {
      console.error("Error enviando correo de seguimiento:", emailErr);
    }
  };

  const notifyFinalized = async (resolutionText: string) => {
    try {
      await apiRequest("/email/send", "POST", {
        authToken: token,
        body: {
          to: `${ticket?.requester?.email || ""}`,
          subject: `Ticket finalizado: ${ticket?.id}`,
          html: emailFinalizado({
            correlativo: ticket?.id || "N/A",
            asignBy: ticket?.requester?.name || "N/A",
            finalizadoPor: currentUser.name,
            fechaCierre: new Date().toISOString(),
            diasAtraso: "0",
            subject: ticket?.subject || "N/A",
            resolucion: resolutionText || "Ticket finalizado",
          }),
        },
      });
    } catch (emailErr) {
      console.error("Error enviando correo de finalización:", emailErr);
    }
  };

  const notifyCancelled = async () => {
    try {
      await apiRequest("/email/send", "POST", {
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
            motivoCancelacion: "Ticket cancelado por el solicitante",
          }),
        },
      });
    } catch (emailErr) {
      console.error("Error enviando correo de cancelación:", emailErr);
    }
  };

  const handleCancelTicket = async () => {
    if (!window.confirm("¿Está seguro de cancelar este ticket?")) return;

    try {
      await apiRequest(`/tickets/${id}/cancel`, "PATCH", {
        authToken: token,
        body: { reason: "Ticket cancelado por el solicitante" },
      });

      await getTicket();
      await notifyCancelled();

      setCurrentStatus(TicketStatus.CANCELLED);
      setPendingStatus(TicketStatus.CANCELLED);
    } catch (error) {
      console.error("Error cancelando ticket:", error);
      alert("No fue posible cancelar el ticket.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <Paper className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 min-w-0">
            <Button
              startIcon={<ArrowLeft size={16} />}
              onClick={() => navigate("/tickets")}
              className="w-fit text-gray-600"
            >
              Volver
            </Button>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Typography
                  variant="h4"
                  className="font-bold text-[#1e242b] break-words"
                >
                  {ticket.id}
                </Typography>

                <Chip
                  icon={statusChip.icon}
                  label={statusChip.label}
                  color={statusChip.color}
                  variant="filled"
                />
              </div>

              <Typography
                variant="h5"
                className="font-semibold text-gray-900 break-words"
              >
                {ticket.subject}
              </Typography>

              <div className="flex flex-wrap gap-2">
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<Tag size={14} />}
                  label={`Prioridad: ${ticket.priority}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<Calendar size={14} />}
                  label={`Ingreso: ${formatDate(ticket.entryDate)}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<Clock size={14} />}
                  label={`Tiempo: ${elapsedTime}`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelTicket}
              >
                Cancelar Ticket
              </Button>
            )}
          </div>
        </div>
      </Paper>

      <Grid container spacing={4}>
        <Grid item={true} xs={12} xl={8}>
          <div className="space-y-6">
            <Paper className={infoCardClass}>
              <Typography variant="h6" className={sectionTitleClass}>
                <ClipboardList size={20} className="text-[#e51b24]" />
                Descripción de la solicitud
              </Typography>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Typography
                  variant="body1"
                  className="text-gray-700 whitespace-pre-wrap leading-7"
                >
                  {ticket.description || "Sin descripción detallada."}
                </Typography>
              </div>
            </Paper>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <Paper className={infoCardClass}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Typography variant="h6" className={sectionTitleClass}>
                    <Paperclip size={20} className="text-[#e51b24]" />
                    Archivos adjuntos
                  </Typography>

                  <Chip
                    size="small"
                    label={`${ticket.attachments.length} archivo${
                      ticket.attachments.length === 1 ? "" : "s"
                    }`}
                    variant="outlined"
                  />
                </div>

                <div className="space-y-3">
                  {ticket.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5">{getFileIcon(attachment.mimeType)}</div>

                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 break-all">
                            {attachment.originalName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(attachment.size)} •{" "}
                            {formatDate(attachment.createdAt)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 break-all">
                            {attachment.mimeType}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Download size={16} />}
                        onClick={() => handleDownloadFile(attachment)}
                        disabled={downloadingId === attachment.id}
                        sx={{
                          borderColor: "#e51b24",
                          color: "#e51b24",
                          "&:hover": {
                            borderColor: "#c4161e",
                            backgroundColor: "#fff5f5",
                          },
                        }}
                      >
                        {downloadingId === attachment.id
                          ? "Descargando..."
                          : "Descargar"}
                      </Button>
                    </div>
                  ))}
                </div>
              </Paper>
            )}

            <Paper className={infoCardClass}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <Typography variant="h6" className={sectionTitleClass}>
                  <MessageSquare size={20} className="text-[#e51b24]" />
                  Seguimiento y acciones
                </Typography>

                <Chip
                  size="small"
                  variant="outlined"
                  label={`${ticket.actions?.length || 0} registros`}
                />
              </div>

              {canAddTracking &&
                currentStatus !== TicketStatus.RESOLVED &&
                currentStatus !== TicketStatus.CANCELLED && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-6 space-y-4">
                    <div>
                      <Typography
                        variant="subtitle2"
                        className="font-bold text-blue-900"
                      >
                        Registrar nueva acción
                      </Typography>
                      <Typography variant="body2" className="text-blue-700 mt-1">
                        Documenta el seguimiento y, si aplica, actualiza el
                        estado del ticket.
                      </Typography>
                    </div>

                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      placeholder="Describa la acción realizada..."
                      value={actionLog}
                      onChange={(e) => setActionLog(e.target.value)}
                      className="bg-white"
                    />

                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <FormControl size="small" sx={{ minWidth: 220 }}>
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
                        disabled={!actionLog.trim() || savingAction}
                        sx={{
                          backgroundColor: "#e51b24",
                          "&:hover": { backgroundColor: "#c4161e" },
                        }}
                      >
                        {savingAction ? "Guardando..." : "Registrar y guardar"}
                      </Button>
                    </div>

                    {(pendingStatus === TicketStatus.RESOLVED ||
                      pendingStatus === TicketStatus.CANCELLED) && (
                      <Alert severity="warning" icon={<AlertCircle size={16} />}>
                        Al guardar este cambio, el ticket quedará cerrado y ya no
                        se podrán registrar más acciones.
                      </Alert>
                    )}
                  </div>
                )}

              <div className="space-y-4">
                <div className="relative pl-6">
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-200" />
                  <div className="relative flex gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="absolute -left-[2px] top-5 h-3 w-3 rounded-full bg-gray-400 border-2 border-white" />
                    <div className="w-10 flex justify-center">
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: "#6b7280",
                          fontSize: 13,
                        }}
                      >
                        Sys
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <Typography
                          variant="subtitle2"
                          className="font-bold text-gray-800"
                        >
                          Sistema
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-gray-500 font-medium"
                        >
                          {formatDate(ticket.entryDate)}
                        </Typography>
                      </div>
                      <Typography
                        variant="body2"
                        className="text-gray-700 mt-1 leading-6"
                      >
                        Ticket ingresado al sistema.
                      </Typography>
                    </div>
                  </div>
                </div>

                {ticket.actions.map((action) => (
                  <div key={action.id} className="relative pl-6">
                    <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-200" />
                    <div className="relative flex gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors">
                      <div className="absolute -left-[2px] top-5 h-3 w-3 rounded-full bg-[#e51b24] border-2 border-white" />
                      <div className="w-10 flex justify-center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "#e51b24",
                            fontSize: 14,
                          }}
                        >
                          {action.userNameSnapshot?.charAt(0) || "U"}
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <Typography
                            variant="subtitle2"
                            className="font-bold text-gray-800"
                          >
                            {action.userNameSnapshot || "Usuario"}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-gray-500 font-medium"
                          >
                            {formatDate(action.date)}
                          </Typography>
                        </div>

                        <Typography
                          variant="body2"
                          className="text-gray-700 mt-2 leading-6 whitespace-pre-wrap"
                        >
                          {action.action}
                        </Typography>
                      </div>
                    </div>
                  </div>
                ))}

                {ticket.actions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                    <Typography className="text-gray-500">
                      Aún no hay acciones registradas para este ticket.
                    </Typography>
                  </div>
                )}
              </div>
            </Paper>
          </div>
        </Grid>

        <Grid item={true} xs={12} xl={4}>
          <div className="space-y-6">
            <Paper className={`${infoCardClass} sticky top-6`}>
              <Typography
                variant="subtitle2"
                className="uppercase text-xs font-bold text-gray-500 mb-4 tracking-wide"
              >
                Resumen operativo
              </Typography>

              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-gray-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Prioridad</p>
                      <p className="font-medium text-sm text-gray-900 mt-1">
                        {ticket.priority}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <Tag size={18} className="text-gray-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Área</p>
                      <p className="font-medium text-sm text-gray-900 mt-1">
                        {ticket.assignee?.area?.name || ticket.area?.name || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-gray-500 mt-0.5" />
                    <div className="w-full min-w-0">
                      <p className="text-xs text-gray-500">Fecha de ingreso</p>
                      <p className="font-medium text-sm text-gray-900 mt-1">
                        {formatDate(ticket.entryDate)}
                      </p>

                      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs font-bold text-blue-700">
                          Tiempo transcurrido
                        </p>
                        <p className="text-sm font-bold text-blue-900 mt-1">
                          {elapsedTime}
                        </p>
                      </div>

                      {isClosedUIStatus(ticket.status) && closedAtIso && (
                        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                          <p className="text-xs font-bold text-green-700">
                            Fecha de cierre
                          </p>
                          <p className="text-sm font-bold text-green-900 mt-1">
                            {formatDate(closedAtIso)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-[#e51b24] mt-0.5" />
                    <div className="w-full min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500">
                          Fecha de entrega
                        </p>

                        {canEditDate && (
                          <button
                            onClick={() => setIsEditingDate(!isEditingDate)}
                            className="text-blue-600 hover:text-blue-800"
                            type="button"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                      </div>

                      {isEditingDate ? (
                        <div className="mt-2 space-y-2">
                          <input
                            type="datetime-local"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm w-full bg-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleDateChange}
                              disabled={savingDate}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs"
                              type="button"
                            >
                              {savingDate ? "Guardando..." : "Guardar"}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingDate(false);
                                setNewDueDate(
                                  ticket.dueDate ? ticket.dueDate.slice(0, 16) : "",
                                );
                              }}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-xs"
                              type="button"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="font-medium text-sm text-[#e51b24] mt-1">
                          {formatDate(ticket.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Divider className="my-6" />

              <div>
                <Typography
                  variant="subtitle2"
                  className="uppercase text-xs font-bold text-gray-500 mb-4 tracking-wide"
                >
                  Involucrados
                </Typography>

                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {ticket.requester?.name?.charAt(0) || "U"}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Solicitante</p>
                        <p className="font-medium text-sm text-gray-900 mt-1">
                          {ticket.requester?.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          {ticket.requester?.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {ticket.country}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "#e51b24",
                        }}
                      >
                        {ticket.assignee?.name?.charAt(0) || "U"}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Responsable</p>
                        <p className="font-medium text-sm text-gray-900 mt-1">
                          {ticket.assignee?.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          {ticket.assignee?.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {ticket.assignee?.area?.name || ticket.area?.name || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <UserIcon size={18} className="text-gray-500 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Permisos actuales</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {isAdmin && <Chip size="small" label="Admin" />}
                          {isAgent && <Chip size="small" label="Jefe/Agent" />}
                          {isAssignee && (
                            <Chip size="small" label="Responsable asignado" />
                          )}
                          {isRequester && (
                            <Chip size="small" label="Solicitante" />
                          )}
                          {!isAdmin &&
                            !isAgent &&
                            !isAssignee &&
                            !isRequester && (
                              <Chip size="small" label="Consulta" />
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Paper>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};