
import React, { useEffect, useState } from 'react';
import { 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Typography, Divider
} from '@mui/material';
import { User, TicketStatus, Ticket } from '../types';
import { formatDate, getDaysOverdue } from '../utils';
import { ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/apiClient';

interface TicketListProps {
  currentUser: User | null;
}

export const TicketList: React.FC<TicketListProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  if (!currentUser) return null;

  // Sorting Function:
  // 1. Most Overdue first (descending days overdue)
  // 2. Soonest Due Date (ascending date)
  const sortTickets = (tickets: Ticket[]) => {
    return [...tickets].sort((a, b) => {
      const overdueA = getDaysOverdue(a.dueDate);
      const overdueB = getDaysOverdue(b.dueDate);

      // If one is overdue and the other isn't, or both are overdue but different amounts
      if (overdueA > 0 || overdueB > 0) {
        return overdueB - overdueA; // Descending: Higher overdue days first
      }

      // If neither is overdue (or equal overdue), sort by nearest due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const token = localStorage.getItem("token") || undefined;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    const getData = async () =>{
      apiRequest<Ticket[]>("/tickets", "GET", { authToken: token }).then((res) => {
        setTickets(res);
      });
    }
    getData();
  }, []);

  // Filter Logic
  const assignedActive = sortTickets(tickets?.filter(t => 
    t.assigneeId === currentUser.id && 
    t.status !== TicketStatus.RESOLVED && 
    t.status !== TicketStatus.CANCELLED
  ));

  const assignedHistory = sortTickets(tickets?.filter(t => 
    t.assigneeId === currentUser.id && 
    (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CANCELLED)
  ));

  const myRequests = sortTickets(tickets?.filter(t => 
    t.requesterId === currentUser.id
  ));

  const renderTable = (tickets: Ticket[], emptyMessage: string, showAssigneeColumn: boolean) => (
    <TableContainer component={Paper} className="shadow-sm border border-gray-200 rounded-xl overflow-hidden mb-8">
        <Table sx={{ minWidth: 650 }} aria-label="ticket table">
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell className="font-bold text-gray-600">ID</TableCell>
              <TableCell className="font-bold text-gray-600">Asunto</TableCell>
              <TableCell className="font-bold text-gray-600">Área</TableCell>
              {showAssigneeColumn ? (
                  <TableCell className="font-bold text-gray-600">Responsable</TableCell>
              ) : (
                  <TableCell className="font-bold text-gray-600">Solicitante</TableCell>
              )}
              <TableCell className="font-bold text-gray-600">Estado</TableCell>
              <TableCell className="font-bold text-gray-600">Fecha Ingreso</TableCell>
              <TableCell className="font-bold text-[#e51b24]">Fecha Entrega</TableCell>
              <TableCell align="right" className="font-bold text-gray-600">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets?.length > 0 ? (
                tickets?.map((ticket) => {
                    const daysOverdue = getDaysOverdue(ticket.dueDate, ticket.completionDate);
                    const isOverdue = daysOverdue > 0 && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CANCELLED;

                    return (
                        <TableRow
                            key={ticket?.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            className={isOverdue ? "bg-red-50 hover:bg-red-100" : ""}
                        >
                            <TableCell className="font-medium text-[#1e242b]">{ticket.id}</TableCell>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {ticket?.subject}
                                    {isOverdue && <AlertCircle size={14} className="text-[#e51b24]" />}
                                </div>
                            </TableCell>
                            <TableCell>{ticket?.area}</TableCell>
                            {showAssigneeColumn ? (
                                <TableCell>{ticket?.assignee?.name || '-'}</TableCell>
                            ) : (
                                <TableCell>{ticket?.requester?.name || '-'}</TableCell>
                            )}
                            <TableCell>
                                <Chip 
                                    label={ticket?.status} 
                                    size="small" 
                                    variant={ticket?.status === TicketStatus.RESOLVED ? "outlined" : "filled"} 
                                    color={
                                        ticket?.status === TicketStatus.RESOLVED ? "success" : 
                                        ticket?.status === TicketStatus.CANCELLED ? "error" :
                                        ticket?.status === TicketStatus.WAITING ? "default" : "primary"
                                    } 
                                />
                            </TableCell>
                            <TableCell className="text-gray-500">{formatDate(ticket.entryDate)}</TableCell>
                            <TableCell>
                                <span className={`font-medium ${isOverdue ? 'text-[#e51b24] font-bold' : 'text-gray-600'}`}>
                                    {formatDate(ticket.dueDate)}
                                </span>
                            </TableCell>
                            <TableCell align="right">
                            <Button 
                                size="small" 
                                endIcon={<ArrowRight size={16} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/tickets/${ticket.id}`);
                                }}
                            >
                                Ver
                            </Button>
                            </TableCell>
                        </TableRow>
                    );
                })
            ) : (
                <TableRow>
                    <TableCell colSpan={8} align="center" className="py-8">
                        <Typography variant="body1" className="text-gray-500">
                            {emptyMessage}
                        </Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1e242b]">Mis Tickets</h1>
          <p className="text-gray-500 mt-1">
            Gestión de tareas asignadas y solicitudes realizadas.
          </p>
        </div>
      </div>

      {/* Section 1: Assigned to Me (Active) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
            <Clock className="text-[#e51b24]" size={24} />
            <Typography variant="h6" className="font-bold text-[#1e242b]">
                Mis Tickets Asignados (Pendientes)
            </Typography>
        </div>
        {renderTable(assignedActive, "No tienes tickets pendientes asignados.", false)}
      </div>

      {/* Section 2: Assigned to Me (History) - Important for Operatives */}
      <div>
        <div className="flex items-center gap-2 mb-4">
            <Typography variant="h6" className="font-bold text-gray-500">
                Historial de Asignaciones (Finalizados)
            </Typography>
        </div>
        {renderTable(assignedHistory, "No tienes tickets finalizados recientemente.", false)}
      </div>

      <Divider className="my-8" />

      {/* Section 3: Created by Me */}
      <div>
        <div className="flex items-center gap-2 mb-4">
            <Typography variant="h6" className="font-bold text-[#1e242b]">
                Mis Solicitudes Creadas
            </Typography>
        </div>
        {renderTable(myRequests, "No has creado ninguna solicitud.", true)}
      </div>

    </div>
  );
};
