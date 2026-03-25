import React, { useState, useMemo, useEffect } from "react";
import {
  Paper,
  Grid,
  Typography,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Collapse,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  PlayCircle,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { KPIStats, User, TicketPriority, TicketStatus, Ticket } from "../types";
import { getDaysOverdue, formatDate } from "../utils";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/apiClient";

interface DashboardProps {
  currentUser: User;
}

interface Country {
  id: number;
  country_name: string;
}

interface Category {
  id: number;
  nombre: string;
  areas: { id: number; name: string }[];
}

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  color?: string;
}> = ({ title, value, icon, subtext, color = "text-[#1e242b]" }) => (
  <Paper
    elevation={0}
    className="p-4 border border-gray-200 bg-white h-full flex flex-col justify-between"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
        <h3 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h3>
      </div>
      <div className="p-2 rounded-lg bg-gray-50 text-gray-600">{icon}</div>
    </div>
    {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
  </Paper>
);

export const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  const [areaFilter, setAreaFilter] = useState<string>("All");
  const [countryFilter, setCountryFilter] = useState<string>("All");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketAreas, setTicketAreas] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [countries, setCountries] = useState<Country[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const token = localStorage.getItem("token") || undefined;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [ticketsRes, usersRes, areasRes, countriesRes, categoriesRes] =
          await Promise.all([
            apiRequest<Ticket[]>("/tickets", "GET", { authToken: token }),
            apiRequest<User[]>("/users", "GET", { authToken: token }),
            apiRequest<{ id: number; name: string }[]>("/areas", "GET", {
              authToken: token,
            }),
            apiRequest<Country[]>("/countries", "GET", { authToken: token }),
            apiRequest<Category[]>("/categorias", "GET", { authToken: token }),
          ]);

        setTickets(ticketsRes);
        setUsers(usersRes);
        setCountries(countriesRes);
        setCategories(categoriesRes);
        setTicketAreas(areasRes);
      } catch (e) {
        console.error("Error fetching data:", e);
        setError("Error al cargar datos del servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const accessibleTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (currentUser.role === "admin") return true;
      return (
        t.assignee.country.id ==
        (typeof currentUser.country === "string"
          ? currentUser.country
          : currentUser.country.id)
      );
    });
  }, [currentUser, tickets]);

  const filteredAreas = useMemo(() => {
    if (categoryFilter === "All") {
      return ticketAreas;
    }

    return ticketAreas.filter((area) => {
      const category = categories.find(
        (cat) => cat.id === Number(categoryFilter),
      );

      return (
        category && category.areas.some((catArea) => catArea.id === area.id)
      );
    });
  }, [categoryFilter, ticketAreas, categories]);

  useEffect(() => {
    if (categoryFilter !== "All") {
      const isCurrentAreaValid =
        filteredAreas.some((area) => area.name === areaFilter) ||
        areaFilter === "All";
      if (!isCurrentAreaValid) {
        setAreaFilter("All");
      }
    }
  }, [categoryFilter, filteredAreas, areaFilter]);

  const filteredTickets = useMemo(() => {
    return accessibleTickets.filter((t) => {
      if (
        categoryFilter !== "All" &&
        t.assignee?.area?.categoriaId !== Number(categoryFilter)
      ) {
        return false;
      }

      if (areaFilter !== "All" && t.assignee?.area?.name !== areaFilter) {
        return false;
      }

      if (
        countryFilter !== "All" &&
        t.assignee.country.id !== Number(countryFilter)
      ) {
        return false;
      }

      if (responsibleFilter !== "All" && t.assigneeId !== responsibleFilter) {
        return false;
      }

      if (priorityFilter !== "All" && t.priority !== priorityFilter) {
        return false;
      }

      if (statusFilter !== "All" && t.status !== statusFilter) {
        return false;
      }

      if (dateRange.start) {
        if (new Date(t.entryDate) < new Date(dateRange.start)) return false;
      }

      if (dateRange.end) {
        if (new Date(t.entryDate) > new Date(dateRange.end)) return false;
      }

      return true;
    });
  }, [
    accessibleTickets,
    areaFilter,
    countryFilter,
    responsibleFilter,
    priorityFilter,
    statusFilter,
    dateRange,
    categoryFilter,
  ]);

  const stats: KPIStats = useMemo(() => {
    const finished = filteredTickets.filter(
      (t) => t.status === TicketStatus.RESOLVED,
    ).length;

    const unfinished = filteredTickets.filter(
      (t) =>
        t.status !== TicketStatus.RESOLVED &&
        t.status !== TicketStatus.CANCELLED,
    ).length;

    const inTransit = filteredTickets.filter(
      (t) => t.status === TicketStatus.IN_PROGRESS,
    ).length;

    const onHold = filteredTickets.filter(
      (t) => t.status === TicketStatus.WAITING,
    ).length;

    const asignadas = filteredTickets.filter(
      (t) =>
        t.status !== TicketStatus.CANCELLED &&
        t.status !== TicketStatus.WAITING,
    ).length;

    const overdue = filteredTickets.filter((t) => {
      if (
        t.status === TicketStatus.RESOLVED ||
        t.status === TicketStatus.CANCELLED
      ) {
        return false;
      }

      return getDaysOverdue(t.dueDate) > 0;
    }).length;

    const compliance = asignadas > 0 ? (finished / asignadas) * 100 : 0;

    return {
      compliance: Math.round(compliance * 10) / 10,
      totalAssigned: asignadas,
      totalUnfinished: unfinished,
      totalFinished: finished,
      inTransit,
      onHold,
      overdue,
    };
  }, [filteredTickets]);

  const areaChartData = useMemo(() => {
    return ticketAreas
      .map((area) => {
        const areaTickets = filteredTickets.filter(
          (t) => t.assignee?.area?.name === area.name,
        );
        return {
          name: area.name,
          Finalizadas: areaTickets.filter(
            (t) => t.status === TicketStatus.RESOLVED,
          ).length,
          Pendientes: areaTickets.filter(
            (t) =>
              t.status !== TicketStatus.RESOLVED &&
              t.status !== TicketStatus.CANCELLED,
          ).length,
        };
      })
      .filter((d) => d.Finalizadas > 0 || d.Pendientes > 0);
  }, [filteredTickets, ticketAreas]);

  const pendingTasks = accessibleTickets
    .filter((t) => {
      if (
        t.status === TicketStatus.RESOLVED ||
        t.status === TicketStatus.CANCELLED
      ) {
        return false;
      }

      if (areaFilter !== "All" && t.assignee?.area?.name !== areaFilter) {
        return false;
      }

      if (
        categoryFilter !== "All" &&
        t.assignee?.area?.category?.id !== Number(categoryFilter)
      ) {
        return false;
      }

      if (
        countryFilter !== "All" &&
        t.assignee?.country?.country_name !== countryFilter
      ) {
        return false;
      }

      if (responsibleFilter !== "All" && t.assigneeId !== responsibleFilter) {
        return false;
      }

      if (priorityFilter !== "All" && t.priority !== priorityFilter) {
        return false;
      }

      if (dateRange.start) {
        if (new Date(t.entryDate) < new Date(dateRange.start)) return false;
      }

      if (dateRange.end) {
        if (new Date(t.entryDate) > new Date(dateRange.end)) return false;
      }

      return true;
    })
    .sort((a, b) => getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate));

  const allTasks = filteredTickets;

  const renderTicketRow = (ticket: Ticket, showCompletion: boolean) => {
    const daysOverdue = getDaysOverdue(ticket.dueDate, ticket.completionDate);
    const isExpanded = expandedTicket === ticket.id;

    return (
      <React.Fragment key={ticket.id}>
        <TableRow
          hover
          className="cursor-pointer transition-colors"
          onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
        >
          <TableCell className="font-medium text-[#e51b24]">
            {ticket.id}
          </TableCell>
          <TableCell>{ticket.assignee?.country?.country_name}</TableCell>
          <TableCell>{ticket.priority.split(" ")[1]}</TableCell>
          <TableCell>{ticket.assignee?.area?.name}</TableCell>
          <TableCell className="max-w-xs truncate">
            {ticket.assignee?.name || "Unassigned"}
          </TableCell>
          <TableCell
            className="max-w-xs truncate text-wrap"
            title={ticket.description}
          >
            {ticket.subject}
          </TableCell>
          <TableCell>{formatDate(ticket.entryDate)}</TableCell>
          <TableCell>{formatDate(ticket.dueDate)}</TableCell>
          {showCompletion && (
            <TableCell>{formatDate(ticket.completionDate || "")}</TableCell>
          )}
          <TableCell>
            <Chip
              label={ticket.status}
              size="small"
              variant={
                ticket.status === TicketStatus.RESOLVED ? "outlined" : "filled"
              }
              color={
                ticket.status === TicketStatus.RESOLVED
                  ? "success"
                  : ticket.status === TicketStatus.CANCELLED
                    ? "error"
                    : ticket.status === TicketStatus.WAITING
                      ? "default"
                      : "primary"
              }
            />
          </TableCell>
          <TableCell align="center">
            <span
              className={`font-bold ${
                daysOverdue > 0 ? "text-[#e51b24]" : "text-green-600"
              }`}
            >
              {daysOverdue}
            </span>
          </TableCell>
          <TableCell>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </TableCell>
        </TableRow>

        <TableRow>
          <TableCell
            style={{ paddingBottom: 0, paddingTop: 0 }}
            colSpan={showCompletion ? 12 : 11}
          >
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box
                sx={{ margin: 2 }}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between mb-4">
                  <Typography
                    variant="h6"
                    gutterBottom
                    component="div"
                    className="font-bold"
                  >
                    Detalle del Seguimiento
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tickets/${ticket.id}`);
                    }}
                  >
                    Ver Completo
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Descripción Completa
                    </p>
                    <p className="text-sm bg-white p-2 rounded border border-gray-100">
                      {ticket.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Acciones Realizadas (Log)
                    </p>
                    {ticket.actions && ticket.actions.length > 0 ? (
                      <ul className="text-sm space-y-1 mt-1">
                        {ticket.actions.map((action) => (
                          <li
                            key={action.id}
                            className="flex gap-2 text-gray-700"
                          >
                            <span className="text-xs text-gray-400 font-mono">
                              {formatDate(action.date)}
                            </span>
                            <span>
                              - {action.action}{" "}
                              <span className="text-xs italic">
                                
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No hay acciones registradas.
                      </p>
                    )}
                  </div>
                </div>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <Paper className="p-4 bg-[#e51b24] rounded-lg shadow-md text-white mb-6">
        <div className="flex items-center gap-2 mb-3 font-bold">
          <Filter size={20} className="text-white" /> FILTROS
        </div>

        <Grid container spacing={2}>
          <Grid item={true} xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="País"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              variant="filled"
              className="bg-white rounded"
              InputProps={{ disableUnderline: true }}
            >
              <MenuItem value="All">Todos</MenuItem>
              {countries.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.country_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item={true} xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Categoría"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              variant="filled"
              className="bg-white rounded"
              InputProps={{ disableUnderline: true }}
            >
              <MenuItem value="All">Todos</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item={true} xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Área"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              variant="filled"
              className="bg-white rounded"
              InputProps={{ disableUnderline: true }}
            >
              <MenuItem value="All">Todas</MenuItem>
              {filteredAreas.map((a) => (
                <MenuItem key={a.id} value={a.name}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item={true} xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Responsable"
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              variant="filled"
              className="bg-white rounded"
              InputProps={{ disableUnderline: true }}
            >
              <MenuItem value="All">Todos</MenuItem>
              {users.length > 0 &&
                users
                  .filter((u) => u.role !== "admin")
                  .map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </MenuItem>
                  ))}
            </TextField>
          </Grid>

          <Grid item={true} xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Prioridad"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              variant="filled"
              className="bg-white rounded"
              InputProps={{ disableUnderline: true }}
            >
              <MenuItem value="All">Todas</MenuItem>
              {Object.values(TicketPriority).map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item={true} xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              variant="filled"
              className="bg-white rounded"
              InputProps={{ disableUnderline: true }}
            >
              <MenuItem value="All">Todos</MenuItem>
              {Object.values(TicketStatus).map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item={true} xs={12} md={2}>
            <div className="flex flex-col gap-1">
              <input
                type="date"
                className="w-full p-1 rounded text-gray-800 text-xs"
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full p-1 rounded text-gray-800 text-xs"
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Paper className="p-4 border border-gray-200">
          <Typography>Cargando datos...</Typography>
        </Paper>
      )}

      {error && (
        <Paper className="p-4 border border-red-200 bg-red-50">
          <Typography className="text-red-600">{error}</Typography>
        </Paper>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-8">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <PieChart width={190} height={190}>
            <Pie
              data={[
                { name: "Cumplimiento", value: stats.compliance },
                { name: "Restante", value: 100 - stats.compliance },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              <Cell fill="#22c55e" />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-gray-500 text-xs font-bold uppercase">
              Cumplimiento
            </span>
            <span className="text-3xl font-bold text-[#1e242b]">
              {stats.compliance}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 md:ml-8 mt-6 md:mt-0">
          <KPICard
            title="Asignadas"
            value={stats.totalAssigned}
            icon={<CheckCircle2 />}
            color="text-blue-600"
          />
          <KPICard
            title="Finalizadas"
            value={stats.totalFinished}
            icon={<CheckCircle2 />}
            color="text-green-600"
          />
          <KPICard
            title="Sin Finalizar"
            value={stats.totalUnfinished}
            icon={<AlertCircle />}
            color="text-orange-600"
          />
          <KPICard
            title="En Progreso"
            value={stats.inTransit}
            icon={<Truck />}
            color="text-yellow-600"
          />
          <KPICard
            title="En Espera"
            value={stats.onHold}
            icon={<PlayCircle />}
            color="text-purple-600"
          />
          <KPICard
            title="Atrasadas"
            value={stats.overdue}
            icon={<Clock />}
            color="text-[#e51b24]"
          />
        </div>
      </div>

      <Paper className="p-6 border border-gray-200">
        <Typography variant="h6" className="font-bold mb-4 text-[#1e242b]">
          Proporción por Área
        </Typography>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Finalizadas" fill="#22c55e" stackId="a" />
              <Bar dataKey="Pendientes" fill="#e51b24" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Paper>

      <div>
        <Typography
          variant="h6"
          className="font-bold mb-2 text-[#1e242b] border-l-4 border-[#e51b24] pl-2"
        >
          Tareas Pendientes (Prioridad por Atraso)
        </Typography>

        <TableContainer
          component={Paper}
          className="shadow-sm border border-gray-200 overflow-auto"
          sx={{maxHeight:500}}
        >
          <Table size="small" stickyHeader>
            <TableHead className="bg-[#e51b24]">
              <TableRow>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}>
                  ID Ticket
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}>
                  País
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}>
                  Prioridad
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}>
                  Área
                </TableCell>
                <TableCell
                  component="th"
                  className="text-white font-bold px-2 max-w-xs truncate"
                  sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}
                >
                  Responsable
                </TableCell>
                <TableCell
                  component="th"
                  className="text-white font-bold px-2 max-w-xs truncate"
                  sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}
                >
                  Descripción
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}>
                  Ingreso
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}>
                  Entrega
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}>
                  Estado
                </TableCell>
                <TableCell
                  component="th"
                  className="text-white font-bold"
                  align="center"
                  sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}
                >
                  Días Atraso
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#e51b24", color: "#fff", fontWeight: 700 }}/>
              </TableRow>
            </TableHead>

            <TableBody>{pendingTasks.map((t) => renderTicketRow(t, false))}</TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="pt-8">
        <Typography
          variant="h6"
          className="font-bold mb-2 text-[#1e242b] border-l-4 border-gray-800 pl-2"
        >
          Total de Tareas Asignadas (Histórico)
        </Typography>

        <TableContainer
          component={Paper}
          className="shadow-sm border border-gray-200 overflow-x-auto"
          sx={{maxHeight:500}}
        >
          <Table size="small" stickyHeader>
            <TableHead >
              <TableRow>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  ID Ticket
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  País
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  Prioridad
                </TableCell>
                <TableCell component="th" className="text-white font-bold"sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  Área
                </TableCell>
                <TableCell
                  component="th"
                  className="text-white font-bold max-w-xs truncate"
                  sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}
                >
                  Responsable
                </TableCell>
                <TableCell
                  component="th"
                  className="text-white font-bold max-w-xs truncate"
                  sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}
                >
                  Descripción
                </TableCell>
                <TableCell component="th" className="text-white font-bold"
                sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  Ingreso
                </TableCell>
                <TableCell component="th" className="text-white font-bold"
                sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  Entrega
                </TableCell>
                <TableCell component="th" className="text-white font-bold"
                sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  Realización
                </TableCell>
                <TableCell component="th" className="text-white font-bold"
                sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}>
                  Estado
                </TableCell>
                <TableCell
                  component="th"
                  className="text-white font-bold"
                  align="center"  
                  sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }}
                >
                  Días Atraso
                </TableCell>
                <TableCell component="th" className="text-white font-bold" sx={{ backgroundColor: "#1f1d1e", color: "#fff", fontWeight: 700 }} />
              </TableRow>
            </TableHead>

            <TableBody>{allTasks.map((t) => renderTicketRow(t, true))}</TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};