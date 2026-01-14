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
  IconButton,
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
import { log } from "console";

interface DashboardProps {
  currentUser: User;
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
      <div className={`p-2 rounded-lg bg-gray-50 text-gray-600`}>{icon}</div>
    </div>
    {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
  </Paper>
);

export const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  // Filters
  const [areaFilter, setAreaFilter] = useState<string>("All");
  const [countryFilter, setCountryFilter] = useState<string>("All"); // New Country Filter
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
  const [ticketAreas, setTicketAreas] = useState<{id: number; name: string}[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const token = localStorage.getItem("token") || undefined;
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [ticketsRes, usersRes, areasRes, countriesRes, categoriesRes] = await Promise.all([
          apiRequest<Ticket[]>("/tickets", "GET", { authToken: token }),
          apiRequest<User[]>("/users", "GET", { authToken: token }),
          apiRequest<{id: number; name: string}[]>("/areas", "GET", { authToken: token }),
          apiRequest<string[]>("/countries", "GET", { authToken: token }),
          apiRequest<Category[]>("/categorias", "GET", { authToken: token }),
          console.log(
            "Dashboard stats:",
            await apiRequest<string[]>("/dashboard/stats", "GET", {
              authToken: token,
            })
          ),
        ]);

        setTickets(ticketsRes);
        console.log("Tickets:", ticketsRes);
        setUsers(usersRes);
        setCountries(countriesRes);
        setCategories(categoriesRes);
        setTicketAreas(areasRes);
        console.log("Users:", usersRes);
        console.log("Areas:", areasRes);
      } catch (e) {
        console.error("Error fetching data:", e);
        setError("Error al cargar datos del servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // 1. Scope Logic (Admin vs Agent)
  const accessibleTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Admin sees all
      if (currentUser.role === "admin") return true;
      //if (currentUser.role === "agent") return t.assignee.country.id === currentUser.country.id;
      // Agent sees only their country
      return t.assignee.country.id == (typeof currentUser.country === 'string' ? currentUser.country : currentUser.country.id);
    });
  }, [currentUser, tickets]);

  // // Extract unique countries for the filter dropdown
  // const availableCountries = useMemo(() => {
  //   const paises = new Set(countries.map((c) => c.country));
  //   return Array.from(paises);
  // }, [countries]);

  // Filter areas based on selected category
  const filteredAreas = useMemo(() => {
    if (categoryFilter === "All") {
      return ticketAreas;
    }
    return ticketAreas.filter(area => {
      const category = categories.find(cat => cat.id === Number(categoryFilter));
      return category && category.areas.some(catArea => catArea.id === area.id);
    });
  }, [categoryFilter, ticketAreas, categories]);

  // Reset area filter when category changes to ensure validity
  useEffect(() => {
    if (categoryFilter !== "All") {
      const isCurrentAreaValid = filteredAreas.some(area => area.name === areaFilter) || areaFilter === "All";
      if (!isCurrentAreaValid) {
        setAreaFilter("All");
      }
    }
  }, [categoryFilter, filteredAreas, areaFilter]);

  // 2. Filter Logic (Applies to Metrics and Total Table, NOT Pending Table totally)
  const filteredTickets = useMemo(() => {
    return accessibleTickets.filter((t) => {
      if (categoryFilter !== "All" && t.assignee?.area?.categoriaId !== Number(categoryFilter)) return false;
      if (areaFilter !== "All" && t.assignee?.area?.name !== areaFilter) return false;
      if (countryFilter !== "All" && t.assignee.country.id !== Number(countryFilter)) return false;
      if (responsibleFilter !== "All" && t.assigneeId !== responsibleFilter)
        return false;
      if (priorityFilter !== "All" && t.priority !== priorityFilter)
        return false;
      if (statusFilter !== "All" && t.status !== statusFilter) return false;

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
    categoryFilter
  ]);

  // 3. KPI Calculations
  const stats: KPIStats = useMemo(() => {
    const totalAssigned = filteredTickets.length;
    console.log("filteredTickets length:", filteredTickets.length);
    const finished = filteredTickets.filter(
      (t) => t.status === TicketStatus.RESOLVED
    ).length;
    const unfinished = filteredTickets.filter(
      (t) =>
        t.status !== TicketStatus.RESOLVED &&
        t.status !== TicketStatus.CANCELLED
    ).length;
    const inTransit = filteredTickets.filter(
      (t) => t.status === TicketStatus.IN_PROGRESS
    ).length;
    const onHold = filteredTickets.filter(
      (t) => t.status === TicketStatus.WAITING
    ).length;

    const asignadas = filteredTickets.filter(
      (t) =>
        t.status !== TicketStatus.CANCELLED && t.status !== TicketStatus.WAITING
    ).length;

    console.log("asignadas:", asignadas);

    // Overdue logic
    const overdue = filteredTickets.filter((t) => {
      if (
        t.status === TicketStatus.RESOLVED ||
        t.status === TicketStatus.CANCELLED
      )
        return false;
      return getDaysOverdue(t.dueDate) > 0;
    }).length;

    const activeForCalc = filteredTickets.filter(
      (t) => t.status !== TicketStatus.CANCELLED
    );
    const overdueActive = activeForCalc.filter(
      (t) => getDaysOverdue(t.dueDate) > 0
    );
    console.log("overdueActive:", overdueActive);
    console.log(
      "activeForCalc:",
      activeForCalc.length,
      "overdueActive:",
      overdueActive.length
    );
    // const compliance = activeForCalc.length > 0
    //   ? ((activeForCalc.length - overdueActive.length) / activeForCalc.length) * 100
    //   : 100;

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

  // 4. Charts Data
  const areaChartData = useMemo(() => {
    const areas = ticketAreas;
    return areas
      .map((area) => {
        const areaTickets = filteredTickets.filter((t) => t.assignee?.area?.name === area.name);
        return {
          name: area.name,
          Finalizadas: areaTickets.filter(
            (t) => t.status === TicketStatus.RESOLVED
          ).length,
          Pendientes: areaTickets.filter(
            (t) =>
              t.status !== TicketStatus.RESOLVED &&
              t.status !== TicketStatus.CANCELLED
          ).length,
        };
      })
      .filter((d) => d.Finalizadas > 0 || d.Pendientes > 0);
  }, [filteredTickets, ticketAreas]);



  // 5. Table Data (Specific Rules)
  // Pending Tasks: All accessible tickets that are NOT resolved/cancelled.
  // "El filtro de periodo no debe de afectar a la tabla de tareas atrasadas/pendientes"
  // So we use accessibleTickets, filter by status, apply other filters (Area, Resp, Prio) but NOT Date.
  const pendingTasks = accessibleTickets
    .filter((t) => {
      if (
        t.status === TicketStatus.RESOLVED ||
        t.status === TicketStatus.CANCELLED
      )
        return false;
      // Apply non-date filters
      if (areaFilter !== "All" && t.assignee?.area?.name !== areaFilter) return false;
      if (categoryFilter !== "All" && t.assignee?.area?.category?.id !== Number(categoryFilter)) return false;
      if (countryFilter !== "All" && t.assignee?.country?.country_name !== countryFilter) return false;
      if (responsibleFilter !== "All" && t.assigneeId !== responsibleFilter)
        return false;
      if (priorityFilter !== "All" && t.priority !== priorityFilter)
        return false;
      if (dateRange.start) {
        if (new Date(t.entryDate) < new Date(dateRange.start)) return false;
      }
      if (dateRange.end) {
        if (new Date(t.entryDate) > new Date(dateRange.end)) return false;
      }
      return true;
    })
    .sort((a, b) => getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate)); // Sort by overdue desc

  const allTasks = filteredTickets; // Total tickets follows all filters

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
          <TableCell>{ticket.priority.split(" ")[1]}</TableCell>{" "}
          {/* Show just '1', '2' etc */}
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

        {/* Expansion for Tracking/Details */}
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
                                ({action.user})
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
      {/* Filters Section */}
      <Paper className="p-4 bg-[#e51b24] rounded-lg shadow-md text-white mb-6">
        <div className="flex items-center gap-2 mb-3 font-bold">
          <Filter size={20} className="text-white" /> FILTROS
        </div>
        <Grid container spacing={2}>
          {/* Country Filter */}
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
              {countries?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.country_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Categoria filter */}

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
              {categories?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
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
              {users?.length > 0 && users
                .filter((u) => u.role !== "admin")
                .map((u) => (
                  <MenuItem key={u.id} value={u.id}>
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

      {/* KPI Section */}
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

      {/* Charts Section */}
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

      {/* Table 1: Pending Tasks */}
      <div>
        <Typography
          variant="h6"
          className="font-bold mb-2 text-[#1e242b] border-l-4 border-[#e51b24] pl-2"
        >
          Reclamos Pendientes (Prioridad por Atraso)
        </Typography>
        <TableContainer
          component={Paper}
          className="shadow-sm border border-gray-200 overflow-x-auto"
        >
          <Table size="small">
            <TableHead className="bg-[#e51b24]">
              <TableRow>
                <th className="text-white font-bold">
                  ID Reclamo
                </th>
                <th className="text-white font-bold" >País</th>
                <th className="text-white font-bold">
                  Prioridad
                </th>
                <th className="text-white font-bold">Área</th>
                <th className="text-white font-bold px-2 max-w-xs truncate">
                  Responsable
                </th>
                <th className="text-white font-bold px-2 max-w-xs truncate">
                  Descripción
                </th>
                <th className="text-white font-bold">Ingreso</th>
                <th className="text-white font-bold">Entrega</th>
                <th className="text-white font-bold">Estado</th>
                <th className="text-white font-bold" align="center">
                  Días Atraso
                </th>
                <th className="text-white font-bold"></th>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingTasks.map((t) => renderTicketRow(t, false))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Table 2: Total Tasks */}
      <div className="pt-8">
        <Typography
          variant="h6"
          className="font-bold mb-2 text-[#1e242b] border-l-4 border-gray-800 pl-2"
        >
          Total de Reclamos Asignados (Histórico)
        </Typography>
        <TableContainer
          component={Paper}
          className="shadow-sm border border-gray-200 overflow-x-auto"
        >
          <Table size="small">
            <TableHead className="bg-gray-800">
              <TableRow>
                <th className="text-white font-bold">ID Reclamo</th>
                <th className="text-white font-bold">País</th>
                <th className="text-white font-bold">Prioridad</th>
                <th className="text-white font-bold">Área</th>
                <th className="text-white font-bold max-w-xs truncate">
                  Responsable
                </th>
                <th className="text-white font-bold max-w-xs truncate">
                  Descripción
                </th>
                <th className="text-white font-bold">Ingreso</th>
                <th className="text-white font-bold">Entrega</th>
                <th className="text-white font-bold">Realización</th>
                <th className="text-white font-bold">Estado</th>
                <th className="text-white font-bold" align="center">
                  Días Atraso
                </th>
                <th className="text-white font-bold"></th>
              </TableRow>
            </TableHead>
            <TableBody>
              {allTasks.map((t) => renderTicketRow(t, true))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};
