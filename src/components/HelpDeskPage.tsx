import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Headset,
  Image as ImageIcon,
  Inbox,
  Info,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {
  PROBLEM_FIELDS,
  ProblemField,
  RESOLUTION_STATUSES,
  ResolutionStatus,
  SeverityLevel,
} from '../types/faq';
import {
  HelpDeskTicket,
  SUPPORT_AGENTS,
  TICKET_STATUSES,
  TicketStatus,
} from '../types/helpdesk';
import { NumberTicker } from './ui/number-ticker-06';

interface HelpDeskPageProps {
  tickets: HelpDeskTicket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  currentUserName: string;
  onUpdateTicketMeta: (
    ticketId: string,
    updates: Partial<Pick<HelpDeskTicket, 'status' | 'assignedAgent'>>
  ) => void;
  onAddMessage: (
    ticketId: string,
    message: string,
    isInternalNote: boolean
  ) => void;
  onResolveAndSyncFaq: (
    ticketId: string,
    resolutionSummary: string,
    faqStatus: ResolutionStatus
  ) => void;
  onOpenNewTicketModal: () => void;
  onSwitchToFaq: (faqId?: string) => void;
  onOpenImage: (url: string, title: string) => void;
}

const SEVERITY_WEIGHT: Record<SeverityLevel, number> = {
  Crítica: 4,
  Alta: 3,
  Média: 2,
  Baixa: 1,
};

const STATUS_WEIGHT: Record<TicketStatus, number> = {
  Novo: 4,
  'Em Atendimento': 3,
  'Aguardando Solicitante': 2,
  Resolvido: 1,
};

function getTicketStatusMeta(status: TicketStatus) {
  switch (status) {
    case 'Novo':
      return {
        icon: Inbox,
        textClass: 'text-[#DC2626]',
        surfaceTint: 'bg-[#FEF2F2]/70',
      };
    case 'Em Atendimento':
      return {
        icon: Clock,
        textClass: 'text-[#B45309]',
        surfaceTint: 'bg-[#FFF7ED]/80',
      };
    case 'Aguardando Solicitante':
      return {
        icon: MessageSquare,
        textClass: 'text-[#9A6B0A]',
        surfaceTint: 'bg-[#FEF9EC]/80',
      };
    case 'Resolvido':
    default:
      return {
        icon: CheckCircle2,
        textClass: 'text-[#2D6A45]',
        surfaceTint: 'bg-[#EDF3EE]/80',
      };
  }
}

function getSeverityMeta(level: SeverityLevel) {
  switch (level) {
    case 'Crítica':
      return {
        icon: AlertOctagon,
        textClass: 'text-[#DC2626]',
      };
    case 'Alta':
      return {
        icon: AlertTriangle,
        textClass: 'text-[#E0732A]',
      };
    case 'Média':
      return {
        icon: ShieldAlert,
        textClass: 'text-[#9A6B0A]',
      };
    case 'Baixa':
    default:
      return {
        icon: Info,
        textClass: 'text-[#2D6A45]',
      };
  }
}

function formatDateTimeBr(isoDate: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

const QUICK_REPLIES = [
  {
    label: 'Solicitar print',
    text: 'Olá! Para agilizar a análise, você poderia anexar um print da tela completa ou informar o número do pedido/romaneio afetado?',
  },
  {
    label: 'Confirmar contorno',
    text: 'Aplicamos um ajuste inicial no registro. Por favor, atualize a página (Ctrl+F5) e confirme se a operação normalizou.',
  },
  {
    label: 'Encaminhado N2',
    text: 'Chamado validado na triagem e encaminhado para a equipe de engenharia N2 com prioridade operacional.',
  },
];

export const HelpDeskPage: React.FC<HelpDeskPageProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  currentUserName,
  onUpdateTicketMeta,
  onAddMessage,
  onResolveAndSyncFaq,
  onOpenNewTicketModal,
  onSwitchToFaq,
  onOpenImage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'Todos'>('Todos');
  const [fieldFilter, setFieldFilter] = useState<ProblemField | 'Todos'>('Todos');

  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const [resolutionDraft, setResolutionDraft] = useState('');
  const [faqTargetStatus, setFaqTargetStatus] = useState<ResolutionStatus>('Resolvido');

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: tickets.length };
    TICKET_STATUSES.forEach((s) => {
      counts[s] = tickets.filter((t) => t.status === s).length;
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = tickets.filter((ticket) => {
      if (statusFilter !== 'Todos' && ticket.status !== statusFilter) return false;
      if (fieldFilter !== 'Todos' && ticket.problemField !== fieldFilter) return false;
      if (q) {
        const haystack = [
          ticket.ticketCode,
          ticket.linkedFaqCode ?? '',
          ticket.title,
          ticket.problemDescription,
          ticket.requesterName,
          ticket.requesterUnit,
          ticket.assignedAgent,
          ticket.problemField,
          ticket.bugType,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const statusDiff = STATUS_WEIGHT[b.status] - STATUS_WEIGHT[a.status];
      if (statusDiff !== 0) return statusDiff;
      const sevDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tickets, statusFilter, fieldFilter, searchQuery]);

  const activeTicket =
    filteredTickets.find((t) => t.id === selectedTicketId) ?? filteredTickets[0] ?? null;

  useEffect(() => {
    if (!activeTicket) return;
    setResolutionDraft(activeTicket.resolutionSummary ?? '');
    setFaqTargetStatus(activeTicket.faqTargetStatus ?? 'Resolvido');
    setReplyText('');
    setIsInternalNote(false);
  }, [activeTicket?.id, activeTicket?.faqTargetStatus, activeTicket?.resolutionSummary]);

  const newQueueCount = statusCounts['Novo'] ?? 0;
  const inProgressCount =
    (statusCounts['Em Atendimento'] ?? 0) + (statusCounts['Aguardando Solicitante'] ?? 0);
  const urgentActiveCount = tickets.filter(
    (t) => t.status !== 'Resolvido' && (t.severity === 'Crítica' || t.severity === 'Alta')
  ).length;
  const resolvedCount = statusCounts['Resolvido'] ?? 0;

  const hasActiveFilters =
    statusFilter !== 'Todos' || fieldFilter !== 'Todos' || searchQuery.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter('Todos');
    setFieldFilter('Todos');
    setSearchQuery('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    onAddMessage(activeTicket.id, replyText.trim(), isInternalNote);
    setReplyText('');
  };

  const handlePublishResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !resolutionDraft.trim()) return;
    onResolveAndSyncFaq(activeTicket.id, resolutionDraft.trim(), faqTargetStatus);
  };

  const agentOptions = useMemo(() => {
    const base = [...SUPPORT_AGENTS];
    const personalOption = `${currentUserName} · Suporte`;
    if (!base.includes(personalOption)) {
      base.splice(1, 0, personalOption);
    }
    return base;
  }, [currentUserName]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      {/* HELP DESK HEADER / HERO */}
      <section
        id="helpdesk-topo"
        className="border-b border-[#D6DCC8] pb-8"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-semibold tracking-wide text-[#2D6A45]"
            >
              Comprove · Mesa de Operações & Suporte Técnico
            </motion.p>
            <h1 className="mt-2.5 text-balance text-3xl font-bold leading-[1.06] tracking-tight sm:text-4xl">
              <motion.span
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="text-[#2D6A45]"
              >
                CHAMADOS{' '}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="text-[#11140d]"
              >
                HELP DESK
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5E6B60] sm:text-base"
            >
              Atenda as solicitações enviadas pelos usuários no portal, acompanhe o prazo de
              SLA, responda ao solicitante e publique a resolução oficial direto no FAQ.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-3 shrink-0"
          >
            <button
              type="button"
              onClick={() => onSwitchToFaq()}
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] px-4 text-xs font-semibold text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:bg-[#EDF3EE] hover:text-[#2D6A45]"
            >
              <BookOpen className="h-4 w-4" />
              Alternar para Central de FAQ
            </button>
            <button
              type="button"
              onClick={onOpenNewTicketModal}
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-[#2D6A45] px-4 text-xs font-semibold text-[#F9FAF5] transition-colors hover:bg-[#245a3a]"
            >
              <Plus className="h-4 w-4" />
              Abrir Novo Chamado
            </button>
          </motion.div>
        </div>

        {/* 4-Column Operational Queue Summary Strip (Hairline grid, NumberFlow ticker, tabular-nums) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 grid grid-cols-2 divide-y divide-[#D6DCC8] overflow-hidden rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] sm:grid-cols-4 sm:divide-x sm:divide-y-0"
        >
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-[#5E6B60]">Novos na fila</p>
            <div className="mt-1">
              <NumberTicker
                value={newQueueCount}
                minimumIntegerDigits={2}
                className="font-mono-tabular text-3xl font-bold tracking-tight text-[#DC2626]"
              />
            </div>
            <p className="mt-0.5 text-[11px] text-[#5E6B60]">Aguardando triagem inicial</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-[#5E6B60]">Em atendimento</p>
            <div className="mt-1">
              <NumberTicker
                value={inProgressCount}
                minimumIntegerDigits={2}
                className="font-mono-tabular text-3xl font-bold tracking-tight text-[#B45309]"
              />
            </div>
            <p className="mt-0.5 text-[11px] text-[#5E6B60]">Análise ou retorno ao usuário</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-[#5E6B60]">Urgência crítica / alta</p>
            <div className="mt-1">
              <NumberTicker
                value={urgentActiveCount}
                minimumIntegerDigits={2}
                className="font-mono-tabular text-3xl font-bold tracking-tight text-[#E0732A]"
              />
            </div>
            <p className="mt-0.5 text-[11px] text-[#5E6B60]">Chamados ativos prioritários</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-[#5E6B60]">Resolvidos</p>
            <div className="mt-1">
              <NumberTicker
                value={resolvedCount}
                minimumIntegerDigits={2}
                className="font-mono-tabular text-3xl font-bold tracking-tight text-[#2D6A45]"
              />
            </div>
            <p className="mt-0.5 text-[11px] text-[#5E6B60]">Sincronizados com a base FAQ</p>
          </div>
        </motion.div>
      </section>

      {/* FILTROS & BUSCA DE CHAMADOS */}
      <motion.section
        aria-label="Filtros da fila de chamados"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 'some' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 space-y-3"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6B60]"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por protocolo (HD-...), título, solicitante ou módulo..."
              aria-label="Buscar chamados no Help Desk"
              className="h-11 w-full rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] pl-10 pr-4 text-sm text-[#1E2B22] placeholder:text-[#5E6B60]/70 focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value as ProblemField | 'Todos')}
              aria-label="Filtrar por módulo"
              className="h-11 rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] px-3.5 text-xs font-medium text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
            >
              <option value="Todos">Todos os módulos</option>
              {PROBLEM_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] px-3.5 text-xs font-medium text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:text-[#2D6A45]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Segmented Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] p-1.5">
          {(['Todos', ...TICKET_STATUSES] as const).map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#2D6A45] text-[#F9FAF5]'
                    : 'text-[#1E2B22] hover:bg-[#EDF3EE] hover:text-[#2D6A45]'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`tabular-nums ${
                    active ? 'text-[#F9FAF5]/85' : 'text-[#5E6B60]'
                  }`}
                >
                  {statusCounts[status] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* FILA DE CHAMADOS + PAINEL DE ATENDIMENTO */}
      <section className="mt-7">
        <div className="mb-4 flex items-center justify-between border-b border-[#D6DCC8] pb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#11140d]">
              Fila de Chamados
            </h2>
            <p className="mt-0.5 tabular-nums text-xs text-[#5E6B60]">
              Exibindo {filteredTickets.length} de {tickets.length}{' '}
              {tickets.length === 1 ? 'solicitação' : 'solicitações'}
            </p>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] px-6 py-12 text-center">
            <Headset className="mx-auto h-10 w-10 text-[#5E6B60]" />
            <h3 className="mt-3 text-base font-semibold text-[#11140d]">
              Nenhum chamado encontrado para esse filtro
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#5E6B60]">
              Altere os filtros da fila ou abra uma nova solicitação para a equipe de suporte.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border border-[#D6DCC8] bg-white px-4 py-2 text-sm font-medium text-[#1E2B22] hover:border-[#2D6A45]"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={onOpenNewTicketModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A45] px-4 py-2 text-sm font-semibold text-[#F9FAF5] hover:bg-[#245a3a]"
              >
                <Plus className="h-4 w-4" />
                Abrir Novo Chamado
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            {/* Left Pane: Ticket List */}
            <div
              role="listbox"
              aria-label="Lista de chamados do Help Desk"
              className="space-y-2 lg:col-span-5"
            >
              {filteredTickets.map((ticket, idx) => {
                const isSelected = ticket.id === activeTicket?.id;
                const statusMeta = getTicketStatusMeta(ticket.status);
                const StatusIcon = statusMeta.icon;
                const sevMeta = getSeverityMeta(ticket.severity);

                return (
                  <motion.button
                    key={ticket.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 'some' }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(idx * 0.04, 0.24),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={() => onSelectTicket(ticket.id)}
                    className={`group flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45] ${
                      isSelected
                        ? 'border-[#2D6A45] bg-[#EDF3EE]/75'
                        : 'border-[#D6DCC8] bg-[#FDFDF9] hover:border-[#2D6A45]/45'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#5E6B60]">
                        <span className="font-mono-tabular font-semibold text-[#11140d]">
                          {ticket.ticketCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${sevMeta.textClass}`}>
                          {ticket.severity}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{ticket.problemField}</span>
                        {ticket.linkedFaqCode && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular text-[#2D6A45]">
                              {ticket.linkedFaqCode}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#11140d]">
                        {ticket.title}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#5E6B60]">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${statusMeta.textClass}`}
                        >
                          <StatusIcon className="h-3 w-3 shrink-0" />
                          {ticket.status}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{ticket.requesterName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          {ticket.assignedAgent === 'Não atribuído'
                            ? 'Sem responsável'
                            : ticket.assignedAgent.split(' · ')[0]}
                        </span>
                        {ticket.imageUrl && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-[#2D6A45]">
                              <ImageIcon className="h-3 w-3" />
                              Print
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={`mt-1 h-4 w-4 shrink-0 transition-transform duration-150 ${
                        isSelected
                          ? 'translate-x-0.5 text-[#2D6A45]'
                          : 'text-[#5E6B60]/60 group-hover:text-[#2D6A45]'
                      }`}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Right Pane: Ticket Workbench */}
            {activeTicket && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 'some' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="lg:sticky lg:top-24 lg:col-span-7"
              >
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activeTicket.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] p-6"
                  >
                    {/* Protocol & Metadata Line */}
                    {(() => {
                      const statusMeta = getTicketStatusMeta(activeTicket.status);
                      const StatusIcon = statusMeta.icon;
                      const sevMeta = getSeverityMeta(activeTicket.severity);
                      const SevIcon = sevMeta.icon;
                      const personalAgent = `${currentUserName} · Suporte`;

                      return (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6DCC8] pb-4">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5E6B60]">
                              <span className="font-mono-tabular font-bold text-[#11140d]">
                                {activeTicket.ticketCode}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${statusMeta.textClass}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                                {activeTicket.status}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${sevMeta.textClass}`}
                              >
                                <SevIcon className="h-3.5 w-3.5 shrink-0" />
                                Severidade {activeTicket.severity} ({activeTicket.severityScore}/8)
                              </span>
                            </div>

                            {activeTicket.linkedFaqId && (
                              <button
                                type="button"
                                onClick={() => onSwitchToFaq(activeTicket.linkedFaqId)}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-[#2D6A45] underline-offset-4 hover:underline"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                Ver {activeTicket.linkedFaqCode} no FAQ
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Title & Requester Info */}
                          <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-[#11140d]">
                            {activeTicket.title}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5E6B60]">
                            <span>
                              Solicitante:{' '}
                              <strong className="font-semibold text-[#1E2B22]">
                                {activeTicket.requesterName}
                              </strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{activeTicket.requesterUnit}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              Aberto em {formatDateTimeBr(activeTicket.createdAt)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              SLA até {formatDateTimeBr(activeTicket.slaDeadline)}
                            </span>
                          </div>

                          {/* Support Assignment & Status Toolbar */}
                          <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-[#D6DCC8] bg-[#F6F6EE]/80 p-3.5 sm:grid-cols-12">
                            <div className="sm:col-span-5">
                              <label
                                htmlFor="ticket-status-select"
                                className="block text-[11px] font-semibold text-[#5E6B60]"
                              >
                                Status do atendimento
                              </label>
                              <select
                                id="ticket-status-select"
                                value={activeTicket.status}
                                onChange={(e) =>
                                  onUpdateTicketMeta(activeTicket.id, {
                                    status: e.target.value as TicketStatus,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-[#D6DCC8] bg-white px-3 py-2 text-xs font-medium text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                              >
                                {TICKET_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-4">
                              <label
                                htmlFor="ticket-agent-select"
                                className="block text-[11px] font-semibold text-[#5E6B60]"
                              >
                                Analista responsável
                              </label>
                              <select
                                id="ticket-agent-select"
                                value={activeTicket.assignedAgent}
                                onChange={(e) =>
                                  onUpdateTicketMeta(activeTicket.id, {
                                    assignedAgent: e.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-[#D6DCC8] bg-white px-3 py-2 text-xs font-medium text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                              >
                                {agentOptions.map((agent) => (
                                  <option key={agent} value={agent}>
                                    {agent}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end sm:col-span-3">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateTicketMeta(activeTicket.id, {
                                    assignedAgent: personalAgent,
                                    status:
                                      activeTicket.status === 'Novo'
                                        ? 'Em Atendimento'
                                        : activeTicket.status,
                                  })
                                }
                                disabled={activeTicket.assignedAgent === personalAgent}
                                className="inline-flex h-[34px] w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D6A45] bg-[#EDF3EE] px-3 text-xs font-semibold text-[#2D6A45] transition-colors hover:bg-[#2D6A45] hover:text-[#F9FAF5] disabled:cursor-default disabled:opacity-50"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Assumir
                              </button>
                            </div>
                          </div>

                          {/* Problem Description & Technical Triage */}
                          <div className="mt-5 space-y-4 border-b border-[#D6DCC8] pb-5">
                            <div>
                              <h4 className="text-xs font-semibold tracking-wide text-[#5E6B60]">
                                Descrição da Solicitação
                              </h4>
                              <p className="mt-1.5 text-sm leading-relaxed text-[#1E2B22]">
                                {activeTicket.problemDescription}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                              <div>
                                <span className="block text-[11px] font-semibold text-[#5E6B60]">
                                  Módulo & Tela
                                </span>
                                <p className="mt-0.5 font-medium text-[#1E2B22]">
                                  {activeTicket.problemField} · {activeTicket.specificScreen}
                                </p>
                              </div>
                              <div>
                                <span className="block text-[11px] font-semibold text-[#5E6B60]">
                                  Classificação Técnica
                                </span>
                                <p className="mt-0.5 font-medium text-[#1E2B22]">
                                  {activeTicket.bugType} · {activeTicket.bugSubType}
                                </p>
                              </div>
                            </div>

                            <div className="text-xs text-[#5E6B60]">
                              <span className="font-semibold text-[#1E2B22]">
                                Triagem de impacto:{' '}
                              </span>
                              <span>{activeTicket.severityBreakdown.impactLabel}</span>
                              <span className="mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span>{activeTicket.severityBreakdown.scopeLabel}</span>
                            </div>

                            {activeTicket.imageUrl && (
                              <div>
                                <span className="block text-xs font-semibold text-[#5E6B60]">
                                  Evidência Anexada pelo Solicitante
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenImage(activeTicket.imageUrl!, activeTicket.title)
                                  }
                                  className="group mt-1.5 block w-full overflow-hidden rounded-xl border border-[#D6DCC8] bg-white text-left transition-colors hover:border-[#2D6A45]"
                                >
                                  <img
                                    src={activeTicket.imageUrl}
                                    alt={activeTicket.imageName || activeTicket.title}
                                    referrerPolicy="no-referrer"
                                    className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                  />
                                  <div className="flex items-center justify-between px-3 py-2 text-xs text-[#5E6B60]">
                                    <span className="truncate">
                                      {activeTicket.imageName || 'evidencia_chamado.png'}
                                    </span>
                                    <span className="shrink-0 font-medium text-[#2D6A45]">
                                      Ampliar imagem
                                    </span>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Thread de Atendimento */}
                          <div className="mt-5">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold tracking-wide text-[#5E6B60]">
                                Histórico de Atendimento ({activeTicket.messages.length})
                              </h4>
                            </div>

                            <div className="mt-3 space-y-2.5">
                              {activeTicket.messages.map((msg) => {
                                const isInternal = Boolean(msg.isInternalNote);
                                const isSupport = msg.authorRole === 'suporte';

                                return (
                                  <div
                                    key={msg.id}
                                    className={`rounded-xl border border-[#D6DCC8] px-4 py-3 ${
                                      isInternal
                                        ? 'bg-[#FEF9EC]'
                                        : isSupport
                                          ? 'bg-[#EDF3EE]/60'
                                          : 'bg-white'
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#11140d]">
                                          {msg.authorName}
                                        </span>
                                        <span aria-hidden="true" className="text-[#5E6B60]">
                                          ·
                                        </span>
                                        {isInternal ? (
                                          <span className="inline-flex items-center gap-1 font-medium text-[#9A6B0A]">
                                            <Lock className="h-3 w-3" />
                                            Nota interna
                                          </span>
                                        ) : (
                                          <span className="text-[#5E6B60]">
                                            {isSupport ? 'Suporte Comprove' : 'Solicitante'}
                                          </span>
                                        )}
                                      </div>
                                      <span className="tabular-nums text-[11px] text-[#5E6B60]">
                                        {formatDateTimeBr(msg.timestamp)}
                                      </span>
                                    </div>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#1E2B22]">
                                      {msg.message}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Reply Composer */}
                            <form onSubmit={handleSendMessage} className="mt-4 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1 rounded-lg border border-[#D6DCC8] bg-[#F6F6EE] p-1">
                                  <button
                                    type="button"
                                    onClick={() => setIsInternalNote(false)}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                      !isInternalNote
                                        ? 'bg-[#2D6A45] text-[#F9FAF5]'
                                        : 'text-[#5E6B60] hover:text-[#11140d]'
                                    }`}
                                  >
                                    Responder ao solicitante
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsInternalNote(true)}
                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                      isInternalNote
                                        ? 'bg-[#9A6B0A] text-white'
                                        : 'text-[#5E6B60] hover:text-[#11140d]'
                                    }`}
                                  >
                                    <Lock className="h-3 w-3" />
                                    Nota interna
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {QUICK_REPLIES.map((qr) => (
                                    <button
                                      key={qr.label}
                                      type="button"
                                      onClick={() => setReplyText(qr.text)}
                                      className="rounded-lg border border-[#D6DCC8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5E6B60] transition-colors hover:border-[#2D6A45] hover:text-[#2D6A45]"
                                    >
                                      {qr.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row">
                                <textarea
                                  rows={2}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={
                                    isInternalNote
                                      ? 'Registrar observação técnica visível apenas para a equipe Help Desk...'
                                      : 'Escreva a resposta de atendimento para o solicitante...'
                                  }
                                  className="flex-1 rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] placeholder:text-[#5E6B60]/70 focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
                                />
                                <button
                                  type="submit"
                                  disabled={!replyText.trim()}
                                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#2D6A45] px-4 text-xs font-semibold text-[#F9FAF5] transition-colors hover:bg-[#245a3a] disabled:cursor-not-allowed disabled:opacity-45 sm:h-auto"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  {isInternalNote ? 'Salvar nota' : 'Enviar resposta'}
                                </button>
                              </div>
                            </form>
                          </div>

                          {/* Resolução Oficial & Publicação no FAQ */}
                          <form
                            onSubmit={handlePublishResolution}
                            className="mt-6 rounded-xl border border-[#D6DCC8] bg-[#EDF3EE]/60 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-[#2D6A45]" />
                                <h4 className="text-sm font-semibold text-[#11140d]">
                                  Resolução Oficial & Sincronização com o FAQ
                                </h4>
                              </div>
                              <span className="text-[11px] font-medium text-[#2D6A45]">
                                {activeTicket.linkedFaqCode
                                  ? `Vinculado ao ${activeTicket.linkedFaqCode}`
                                  : 'Publicará novo item no FAQ'}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <div>
                                <label
                                  htmlFor="faq-sync-status"
                                  className="block text-xs font-semibold text-[#1E2B22]"
                                >
                                  Status no FAQ
                                </label>
                                <select
                                  id="faq-sync-status"
                                  value={faqTargetStatus}
                                  onChange={(e) =>
                                    setFaqTargetStatus(e.target.value as ResolutionStatus)
                                  }
                                  className="mt-1 w-full rounded-lg border border-[#D6DCC8] bg-white px-3 py-2 text-xs text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                                >
                                  {RESOLUTION_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label
                                  htmlFor="faq-sync-resolution"
                                  className="block text-xs font-semibold text-[#1E2B22]"
                                >
                                  Orientação / Solução Oficial
                                </label>
                                <textarea
                                  id="faq-sync-resolution"
                                  rows={3}
                                  required
                                  value={resolutionDraft}
                                  onChange={(e) => setResolutionDraft(e.target.value)}
                                  placeholder="Descreva o procedimento definitivo ou solução de contorno que ficará disponível na Central de FAQ..."
                                  className="mt-1 w-full rounded-lg border border-[#D6DCC8] bg-white px-3 py-2 text-xs leading-relaxed text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[11px] text-[#5E6B60]">
                                Somente o suporte Help Desk define este status. Ao salvar, a
                                mudança reflete imediatamente na página de FAQ dos usuários.
                              </p>
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#2D6A45] px-4 py-2 text-xs font-semibold text-[#F9FAF5] transition-colors hover:bg-[#245a3a]"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Salvar Status e Resolução no FAQ
                              </button>
                            </div>
                          </form>
                        </>
                      );
                    })()}
                  </motion.article>
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};
