
export const MAX_USERS = 50;

export enum TicketPriority {
  P1 = 'Prioridad 1 (1 Hora)',
  P2 = 'Prioridad 2 (24 Horas)',
  P3 = 'Prioridad 3 (72 Horas)',
  P4 = 'Prioridad 4 (Indefinido)',
  P5 = 'Prioridad 5 (Indefinido)',
}

export enum TicketStatus {
  WAITING = 'En Espera', // En Espera
  IN_PROGRESS = 'En Progreso', // En Tránsito/Progreso
  RESOLVED = 'Finalizado', // Finalizado
  CANCELLED = 'Cancelado',
}

export enum TicketArea {
  CANTINA = 'Cantina',
  OFICINA = 'Oficina',
  BACKOFFICE = 'Backoffice',
  VEHICULO = 'Vehículo',
  HELPDESK = 'Helpdesk',
  CENTRO_ADMIN = 'Centro Administrativo',
  SOPORTE_ADMIN = 'Soporte Administrativo',
}

export type UserRole = 'admin' | 'agent' | 'specialist'; 
// admin: Admin Global (rcanto)
// agent: Jefes País (jefesv, jefegt) - Dashboard, Create, Edit Dates
// specialist: Operativo (operativo) - Read Assigned, Add Actions only.

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country: object;
  area: TicketArea;
  managerId?: string; // Persona a cargo
  avatar?: string;
  // Nuevos campos para configuración avanzada
  assignableTo?: string[]; // IDs de personas a las que este usuario puede poner tickets (Personas a cargo)
  receivableFrom?: string[]; // IDs de personas que pueden ponerle tickets a este usuario
}

export interface TicketAction {
  id: string;
  date: string; // ISO String
  action: string;
  user: string;
}

export interface Ticket {
  id: string;
  subject: string;
  type: string;
  area: TicketArea;
  requester: string;
  requesterId: string;
  assignee: string;
  assigneeId: string;
  priority: TicketPriority;
  status: TicketStatus;
  entryDate: string; // Fecha de Ingreso
  dueDate: string; // Fecha de Entrega (Calculated or Manual)
  completionDate?: string; // Fecha de Realización
  country: string; // For filtering
  description?: string;
  actions: TicketAction[]; // Seguimiento con acciones
}

export interface KPIStats {
  compliance: number;
  totalAssigned: number;
  totalUnfinished: number;
  totalFinished: number;
  inTransit: number;
  onHold: number;
  overdue: number;
}

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'Roberto Canto', 
    email: 'rcanto@grupostt.com', 
    role: 'admin', 
    country: 'Global', // Admin sees all regardless
    area: TicketArea.OFICINA, 
    avatar: 'https://ui-avatars.com/api/?name=Roberto+Canto&background=e51b24&color=fff',
    assignableTo: ['2', '3', '4'],
    receivableFrom: ['2', '3']
  },
  { 
    id: '2', 
    name: 'Jefe El Salvador', 
    email: 'jefesv@grupostt.com', 
    role: 'agent', 
    country: 'El Salvador', 
    area: TicketArea.CENTRO_ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Jefe+SV&background=1e242b&color=fff',
    assignableTo: [],
    receivableFrom: ['1']
  },
  { 
    id: '3', 
    name: 'Jefe Guatemala', 
    email: 'jefegt@grupostt.com', 
    role: 'agent', 
    country: 'Guatemala', 
    area: TicketArea.OFICINA,
    avatar: 'https://ui-avatars.com/api/?name=Jefe+GT&background=1e242b&color=fff',
    assignableTo: ['4'],
    receivableFrom: ['1', '4']
  },
  { 
    id: '4', 
    name: 'Operativo', 
    email: 'operativo@grupostt.com', 
    role: 'specialist', 
    country: 'Guatemala', 
    area: TicketArea.HELPDESK,
    avatar: 'https://ui-avatars.com/api/?name=Operativo+User&background=6b7280&color=fff',
    assignableTo: ['3'],
    receivableFrom: ['1', '3']
  },
];

export const TICKET_TYPES = [
  'Hardware',
  'Software',
  'Redes',
  'Acceso/Cuentas',
  'Mantenimiento',
  'Otros'
];

export const MOCK_TICKETS: Ticket[] = [
  // Tickets Guatemala
  { 
    id: 'GT-2025-192', 
    subject: 'Facturas de Comunicaciones', 
    type: 'Otros', 
    area: TicketArea.SOPORTE_ADMIN, 
    priority: TicketPriority.P2, 
    status: TicketStatus.CANCELLED, 
    entryDate: '2025-07-15T09:00:00',
    dueDate: '2025-07-16T09:00:00',
    requester: 'Roberto Canto', requesterId: '1', 
    assignee: 'Jefe Guatemala', assigneeId: '3', 
    country: 'Guatemala',
    description: 'Facturas de comunicaciones pendientes de pago.',
    actions: [
      { id: '1', date: '2025-07-15T10:00:00', action: 'Revisión inicial', user: 'Jefe Guatemala' }
    ]
  },
  { 
    id: 'GT-2025-270', 
    subject: 'Cotizar lustradora', 
    type: 'Mantenimiento', 
    area: TicketArea.OFICINA, 
    priority: TicketPriority.P3, 
    status: TicketStatus.RESOLVED, 
    entryDate: '2025-10-13T08:30:00',
    dueDate: '2025-10-16T08:30:00',
    completionDate: '2025-10-15T14:00:00',
    requester: 'Jefe Guatemala', requesterId: '3', 
    assignee: 'Operativo', assigneeId: '4', 
    country: 'Guatemala',
    description: 'Cotizar y enviar informacion sobre una lustradora de zapatos',
    actions: []
  },
  // Ticket Assigned to Operativo
  { 
    id: 'GT-2025-231', 
    subject: 'Instalación Antivirus Masiva', 
    type: 'Software', 
    area: TicketArea.HELPDESK, 
    priority: TicketPriority.P1, 
    status: TicketStatus.IN_PROGRESS, 
    entryDate: '2025-08-13T10:00:00',
    dueDate: '2025-08-13T11:00:00',
    requester: 'Roberto Canto', requesterId: '1', 
    assignee: 'Operativo', assigneeId: '4', 
    country: 'Guatemala',
    description: 'Instalar antivirus en laptops nuevas de RRHH.',
    actions: []
  },
  // Tickets El Salvador
  { 
    id: 'SV-2025-001', 
    subject: 'Mantenimiento Aires Acondicionados', 
    type: 'Mantenimiento', 
    area: TicketArea.OFICINA, 
    priority: TicketPriority.P2, 
    status: TicketStatus.WAITING, 
    entryDate: '2025-09-15T09:00:00',
    dueDate: '2025-09-16T09:00:00',
    requester: 'Jefe El Salvador', requesterId: '2', 
    assignee: 'Jefe El Salvador', assigneeId: '2', 
    country: 'El Salvador',
    description: 'Revisión técnica de aires acondicionados en sala de juntas.',
    actions: []
  },
  { 
    id: 'SV-2025-002', 
    subject: 'Compra de Insumos', 
    type: 'Otros', 
    area: TicketArea.CANTINA, 
    priority: TicketPriority.P3, 
    status: TicketStatus.IN_PROGRESS, 
    entryDate: '2025-09-18T09:00:00',
    dueDate: '2025-09-21T09:00:00',
    requester: 'Jefe El Salvador', requesterId: '2', 
    assignee: 'Jefe El Salvador', assigneeId: '2', 
    country: 'El Salvador',
    description: 'Compra semanal.',
    actions: []
  }
];
