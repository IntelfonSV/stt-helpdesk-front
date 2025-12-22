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
} from "lucide-react";
import { TicketStatus, User } from "../types";
import { formatDate } from "../utils";
import { apiRequest } from "../lib/apiClient";

interface TicketDetailProps {
  currentUser: User | null;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ currentUser }) => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const token = localStorage.getItem("token") || undefined;

  const getTicket = () => {
    apiRequest<Ticket>(`/tickets/${id}`, "GET", { authToken: token }).then(
      (res) => {
        setTicket(res);
      }
    );
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

  // Reset state if ticket ID changes (navigation between tickets)
  useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status);
      setPendingStatus(ticket.status);
      setActionLog("");
    }
  }, [ticket?.id, ticket]);

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
    });

    // Commit the pending status to current status
    setCurrentStatus(pendingStatus);

    //alert(`Acción registrada: "${actionLog}". Estado actualizado a: ${pendingStatus}`);

    // Reset log but keep statu
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

  // Handler for the global Cancel button (Requester action)
  const handleCancelTicket = () => {
    if (window.confirm("¿Está seguro de cancelar este ticket?")) {
      apiRequest(`/tickets/${id}/cancel`, "PATCH", {
        authToken: token,
        body: { reason: "Ticket cancelado por el solicitante" },
      }).then(() => {
        getTicket();
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
            <Typography variant="h4" className="font-bold text-[#1e242b]">
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
        <Grid item xs={12} lg={8}>
          <Paper className="p-6 border border-gray-200 shadow-sm rounded-xl mb-6">
            <Typography
              variant="h6"
              className="font-bold mb-4 flex items-center gap-2 text-[#1e242b]"
            >
              <Tag size={20} className="text-[#e51b24]" />
              Descripción de la Solicitud
            </Typography>
            <Typography
              variant="body1"
              className="text-gray-700 whitespace-pre-wrap leading-relaxed"
            >
              {ticket.description || "Sin descripción detallada."}
            </Typography>
          </Paper>

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
                <Paper className="p-4 border border-gray-200 bg-gray-50">
                  <Typography
                    variant="subtitle2"
                    className="mb-2 font-bold text-gray-700"
                  >
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
                    >
                      Registrar y Guardar
                    </Button>
                  </div>
                  {/* UX Hint: Show warning if user selected a closing status but hasn't saved yet */}
                  {(pendingStatus === TicketStatus.RESOLVED ||
                    pendingStatus === TicketStatus.CANCELLED) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      <AlertCircle size={14} />
                      <span>
                        Atención: Al guardar, el ticket se cerrará y no podrá
                        agregar más acciones.
                      </span>
                    </div>
                  )}
                </Paper>
              )}

            {/* History List */}
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg opacity-75">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  Sys
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {formatDate(ticket.entryDate)}
                  </p>
                  <p className="text-sm">Ticket ingresado al sistema.</p>
                </div>
              </div>
              {ticket.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm"
                >
                  {/* <Avatar sx={{ bgcolor: '#1e242b', width: 32, height: 32 }}>{action.user.charAt(0)}</Avatar> */}
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                  <Avatar sx={{ width: 32, height: 32 }}>{action.userNameSnapshot?.charAt(0) || 'U'}</Avatar>

                      <Typography variant="subtitle2" className="font-bold">
                        {action.userNameSnapshot}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {formatDate(action.date)}
                      </Typography>
                    </div>
                    <Typography variant="body2" className="text-gray-700 mt-1">
                      {action.action}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper className="p-6 border border-gray-200 shadow-sm rounded-xl space-y-6">
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
                    <p className="font-medium text-sm">{ticket.area}</p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div className="w-full">
                    <p className="text-xs text-gray-500">Fecha Ingreso</p>
                    <p className="font-medium text-sm">
                      {formatDate(ticket.entryDate)}
                    </p>
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
