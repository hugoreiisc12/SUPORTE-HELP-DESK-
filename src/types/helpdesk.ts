import {
  BugType,
  ProblemField,
  ResolutionStatus,
  SeverityDiagnosticBreakdown,
  SeverityLevel,
} from './faq';

export type TicketStatus =
  | 'Novo'
  | 'Em Atendimento'
  | 'Aguardando Solicitante'
  | 'Resolvido';

export const TICKET_STATUSES: TicketStatus[] = [
  'Novo',
  'Em Atendimento',
  'Aguardando Solicitante',
  'Resolvido',
];

export const SUPPORT_AGENTS: string[] = [
  'Não atribuído',
  'Marina Costa · N1',
  'Rafael Mendes · N2',
  'Lucas Oliveira · Logística',
  'Camila Ferreira · Fiscal/NF-e',
];

export interface TicketMessage {
  id: string;
  authorName: string;
  authorRole: 'solicitante' | 'suporte' | 'sistema';
  message: string;
  timestamp: string;
  isInternalNote?: boolean;
}

export interface HelpDeskTicket {
  id: string;
  ticketCode: string;
  linkedFaqId?: string;
  linkedFaqCode?: string;
  title: string;
  problemDescription: string;
  problemField: ProblemField;
  specificScreen: string;
  bugType: BugType;
  bugSubType: string;
  severity: SeverityLevel;
  severityScore: number;
  severityBreakdown: SeverityDiagnosticBreakdown;
  status: TicketStatus;
  requesterName: string;
  requesterEmail: string;
  requesterUnit: string;
  assignedAgent: string;
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  imageName?: string;
  resolutionSummary?: string;
  faqTargetStatus?: ResolutionStatus;
  syncedToFaq: boolean;
  messages: TicketMessage[];
}
