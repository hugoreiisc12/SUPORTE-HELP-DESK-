import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import {
  HelpCircle,
  Search,
  ListFilter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  X,
  FileQuestion,
  User,
  Camera,
  LogOut,
  LogIn,
  Trash2,
  Headset,
  BookOpen,
} from 'lucide-react';
import { INITIAL_FAQS } from './data/initialFaqs';
import { INITIAL_TICKETS } from './data/initialTickets';
import {
  FaqItem,
  RESOLUTION_STATUSES,
  ResolutionStatus,
  SeverityLevel,
} from './types/faq';
import { HelpDeskTicket, TicketMessage } from './types/helpdesk';
import { CreateFaqModal } from './components/CreateFaqModal';
import { FaqSplitPane } from './components/FaqSplitPane';
import { HelpDeskPage } from './components/HelpDeskPage';
import { ColdEmailCrowdHero } from './components/ui/cold-email-crowd-hero';

const STORAGE_KEY_FAQS = 'portal_jfc_faqs_v1';
const STORAGE_KEY_UPVOTES = 'portal_jfc_upvotes_v1';
const STORAGE_KEY_USER = 'comprove_user_profile_v1';
const STORAGE_KEY_TICKETS = 'comprove_helpdesk_tickets_v1';

type ActivePage = 'faq' | 'helpdesk';

interface UserProfile {
  isLoggedIn: boolean;
  name: string;
  email: string;
  photoUrl?: string;
}

const DEFAULT_USER: UserProfile = {
  isLoggedIn: true,
  name: 'Usuário Comprove',
  email: 'hugoreiis12@gmail.com',
};

function computeSlaDeadline(severity: SeverityLevel, createdAtIso: string): string {
  const base = new Date(createdAtIso).getTime();
  const hoursBySeverity: Record<SeverityLevel, number> = {
    Crítica: 2,
    Alta: 6,
    Média: 24,
    Baixa: 48,
  };
  return new Date(base + hoursBySeverity[severity] * 3600 * 1000).toISOString();
}

export function App() {
  const [activePage, setActivePage] = useState<ActivePage>('faq');

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isLoggedIn === 'boolean') return parsed;
      }
    } catch {
      // Fallback to default logged user
    }
    return DEFAULT_USER;
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAQS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial data
    }
    return INITIAL_FAQS;
  });

  const [tickets, setTickets] = useState<HelpDeskTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TICKETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial Help Desk queue
    }
    return INITIAL_TICKETS;
  });

  const [upvotedIds, setUpvotedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPVOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read failure
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [resolutionFilter, setResolutionFilter] = useState<ResolutionStatus | 'Todos'>('Todos');
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_FAQS[0]?.id ?? null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    INITIAL_TICKETS[0]?.id ?? null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  // Login Gate Form State (when user logs out)
  const [loginName, setLoginName] = useState(user.name || 'Usuário Comprove');
  const [loginEmail, setLoginEmail] = useState(user.email || 'hugoreiis12@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Profile Modal Draft State
  const [draftName, setDraftName] = useState(user.name);
  const [draftEmail, setDraftEmail] = useState(user.email);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {
      // Ignore storage quota errors
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(faqs));
    } catch {
      // Ignore storage quota errors
    }
  }, [faqs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    } catch {
      // Ignore storage quota errors
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UPVOTES, JSON.stringify(upvotedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [upvotedIds]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!lightboxImage && !isProfileModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
        setIsProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxImage, isProfileModalOpen]);

  const resolutionCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: faqs.length };
    RESOLUTION_STATUSES.forEach((s) => {
      counts[s] = faqs.filter((f) => f.resolutionStatus === s).length;
    });
    return counts;
  }, [faqs]);

  const openTicketCount = useMemo(
    () => tickets.filter((t) => t.status !== 'Resolvido').length,
    [tickets]
  );

  const filteredAndSortedFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = faqs.filter((item) => {
      if (resolutionFilter !== 'Todos' && item.resolutionStatus !== resolutionFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          item.code,
          item.title,
          item.problemDescription,
          item.problemField,
          item.specificScreen,
          item.bugType,
          item.bugSubType,
          item.resolutionText,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (b.askCount !== a.askCount) return b.askCount - a.askCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [faqs, resolutionFilter, searchQuery]);

  const isTop10Capped = !showAllFaqs && filteredAndSortedFaqs.length > 10;
  const displayedFaqs = isTop10Capped
    ? filteredAndSortedFaqs.slice(0, 10)
    : filteredAndSortedFaqs;

  const hasActiveFilters =
    resolutionFilter !== 'Todos' || searchQuery.trim().length > 0;

  const handleClearFilters = () => {
    setResolutionFilter('Todos');
    setSearchQuery('');
  };

  const handleSwitchPage = (page: ActivePage, targetFaqId?: string) => {
    setActivePage(page);
    if (page === 'faq' && targetFaqId) {
      setResolutionFilter('Todos');
      setSearchQuery('');
      setShowAllFaqs(true);
      setSelectedId(targetFaqId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateFaq = (
    payload: Omit<FaqItem, 'id' | 'code' | 'askCount' | 'createdAt' | 'updatedAt'>
  ) => {
    const nextNumber = faqs.length + 1;
    const nowIso = new Date().toISOString();
    const newItem: FaqItem = {
      ...payload,
      id: `faq-${Date.now()}`,
      code: `FAQ-${String(nextNumber).padStart(2, '0')}`,
      askCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const nextTicketNumber = 2042 + tickets.length;
    const newTicket: HelpDeskTicket = {
      id: `hd-${Date.now()}`,
      ticketCode: `HD-${nextTicketNumber}`,
      linkedFaqId: newItem.id,
      linkedFaqCode: newItem.code,
      title: newItem.title,
      problemDescription: newItem.problemDescription,
      problemField: newItem.problemField,
      specificScreen: newItem.specificScreen,
      bugType: newItem.bugType,
      bugSubType: newItem.bugSubType,
      severity: newItem.severity,
      severityScore: newItem.severityScore,
      severityBreakdown: newItem.severityBreakdown,
      status: payload.resolutionStatus === 'Resolvido' ? 'Resolvido' : 'Novo',
      requesterName: user.name,
      requesterEmail: user.email,
      requesterUnit: 'Operação Comprove',
      assignedAgent: 'Não atribuído',
      slaDeadline: computeSlaDeadline(newItem.severity, nowIso),
      createdAt: nowIso,
      updatedAt: nowIso,
      imageUrl: newItem.imageUrl,
      imageName: newItem.imageName,
      resolutionSummary: newItem.resolutionText,
      faqTargetStatus: newItem.resolutionStatus,
      syncedToFaq: true,
      messages: [
        {
          id: `msg-${Date.now()}`,
          authorName: user.name,
          authorRole: 'solicitante',
          message: newItem.problemDescription,
          timestamp: nowIso,
        },
      ],
    };

    setFaqs((prev) => [newItem, ...prev]);
    setTickets((prev) => [newTicket, ...prev]);
    setResolutionFilter('Todos');
    setSearchQuery('');
    setShowAllFaqs(true);
    setSelectedId(newItem.id);
    setSelectedTicketId(newTicket.id);

    if (activePage === 'helpdesk') {
      setToastMessage(
        `Chamado ${newTicket.ticketCode} aberto na fila e vinculado ao ${newItem.code}.`
      );
    } else {
      setToastMessage(
        `${newItem.code} publicado e enviado para o Help Desk (${newTicket.ticketCode}).`
      );
      const listEl = document.getElementById('lista-faqs');
      if (listEl) {
        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleUpvote = (id: string) => {
    const already = upvotedIds.includes(id);
    setFaqs((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, askCount: Math.max(0, item.askCount + (already ? -1 : 1)) }
          : item
      )
    );
    setUpvotedIds((prev) =>
      already ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleUpdateTicketMeta = (
    ticketId: string,
    updates: Partial<Pick<HelpDeskTicket, 'status' | 'assignedAgent'>>
  ) => {
    const nowIso = new Date().toISOString();
    const targetTicket = tickets.find((t) => t.id === ticketId);

    const mappedFaqStatus: ResolutionStatus | undefined = updates.status
      ? updates.status === 'Resolvido'
        ? 'Resolvido'
        : updates.status === 'Novo'
          ? 'Pendente'
          : 'Em Análise'
      : undefined;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              ...updates,
              ...(mappedFaqStatus ? { faqTargetStatus: mappedFaqStatus } : {}),
              updatedAt: nowIso,
            }
          : t
      )
    );

    if (mappedFaqStatus && targetTicket?.linkedFaqId) {
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === targetTicket.linkedFaqId
            ? {
                ...f,
                resolutionStatus: mappedFaqStatus,
                updatedAt: nowIso,
              }
            : f
        )
      );
    }

    if (updates.status) {
      setToastMessage(
        targetTicket?.linkedFaqCode
          ? `Status alterado para "${updates.status}" e refletido no ${targetTicket.linkedFaqCode}.`
          : `Status do chamado alterado para "${updates.status}".`
      );
    } else if (updates.assignedAgent) {
      setToastMessage(`Chamado atribuído para ${updates.assignedAgent}.`);
    }
  };

  const handleAddTicketMessage = (
    ticketId: string,
    message: string,
    isInternalNote: boolean
  ) => {
    const nowIso = new Date().toISOString();
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      authorName: `${user.name} · Suporte`,
      authorRole: 'suporte',
      message,
      timestamp: nowIso,
      isInternalNote,
    };

    const targetTicket = tickets.find((t) => t.id === ticketId);
    const shouldMoveToInAnalysis =
      !isInternalNote && targetTicket?.status === 'Novo';

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: shouldMoveToInAnalysis ? 'Em Atendimento' : t.status,
              ...(shouldMoveToInAnalysis
                ? { faqTargetStatus: 'Em Análise' as ResolutionStatus }
                : {}),
              assignedAgent:
                t.assignedAgent === 'Não atribuído'
                  ? `${user.name} · Suporte`
                  : t.assignedAgent,
              updatedAt: nowIso,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );

    if (shouldMoveToInAnalysis && targetTicket?.linkedFaqId) {
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === targetTicket.linkedFaqId && f.resolutionStatus === 'Pendente'
            ? { ...f, resolutionStatus: 'Em Análise', updatedAt: nowIso }
            : f
        )
      );
    }

    setToastMessage(
      isInternalNote
        ? 'Nota interna registrada no chamado.'
        : 'Resposta enviada ao solicitante.'
    );
  };

  const handleResolveTicketAndSyncFaq = (
    ticketId: string,
    resolutionSummary: string,
    faqStatus: ResolutionStatus
  ) => {
    const nowIso = new Date().toISOString();
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    const syncNote: TicketMessage = {
      id: `msg-sync-${Date.now()}`,
      authorName: `${user.name} · Suporte`,
      authorRole: 'suporte',
      message: `Resolução oficial (${faqStatus}) publicada no FAQ: ${resolutionSummary}`,
      timestamp: nowIso,
    };

    const nextTicketStatus =
      faqStatus === 'Resolvido'
        ? 'Resolvido'
        : faqStatus === 'Pendente'
          ? 'Novo'
          : 'Em Atendimento';

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: nextTicketStatus,
              assignedAgent:
                t.assignedAgent === 'Não atribuído'
                  ? `${user.name} · Suporte`
                  : t.assignedAgent,
              resolutionSummary,
              faqTargetStatus: faqStatus,
              syncedToFaq: true,
              updatedAt: nowIso,
              messages: [...t.messages, syncNote],
            }
          : t
      )
    );

    if (targetTicket.linkedFaqId) {
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === targetTicket.linkedFaqId
            ? {
                ...f,
                resolutionStatus: faqStatus,
                resolutionText: resolutionSummary,
                updatedAt: nowIso,
              }
            : f
        )
      );
      setToastMessage(
        `${targetTicket.ticketCode} atualizado e sincronizado com ${targetTicket.linkedFaqCode}.`
      );
    } else {
      const nextNumber = faqs.length + 1;
      const createdFaq: FaqItem = {
        id: `faq-${Date.now()}`,
        code: `FAQ-${String(nextNumber).padStart(2, '0')}`,
        title: targetTicket.title,
        problemDescription: targetTicket.problemDescription,
        problemField: targetTicket.problemField,
        specificScreen: targetTicket.specificScreen,
        bugType: targetTicket.bugType,
        bugSubType: targetTicket.bugSubType,
        resolutionStatus: faqStatus,
        resolutionText: resolutionSummary,
        severity: targetTicket.severity,
        severityScore: targetTicket.severityScore,
        severityBreakdown: targetTicket.severityBreakdown,
        askCount: 1,
        createdAt: targetTicket.createdAt,
        updatedAt: nowIso,
        imageUrl: targetTicket.imageUrl,
        imageName: targetTicket.imageName,
      };
      setFaqs((prev) => [createdFaq, ...prev]);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, linkedFaqId: createdFaq.id, linkedFaqCode: createdFaq.code }
            : t
        )
      );
      setToastMessage(
        `${targetTicket.ticketCode} concluído e publicado como ${createdFaq.code}.`
      );
    }
  };

  const handleResetDemoData = () => {
    setFaqs(INITIAL_FAQS);
    setTickets(INITIAL_TICKETS);
    setUpvotedIds([]);
    handleClearFilters();
    setShowAllFaqs(false);
    setSelectedId(INITIAL_FAQS[0]?.id ?? null);
    setSelectedTicketId(INITIAL_TICKETS[0]?.id ?? null);
    setToastMessage('Base padrão de FAQs e chamados restaurada.');
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToastMessage('Selecione um arquivo de imagem válido (PNG, JPG ou WebP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setToastMessage('A foto de perfil deve ter no máximo 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUser((prev) => ({ ...prev, photoUrl: reader.result as string }));
        setToastMessage('Foto de perfil atualizada.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim() || !draftEmail.trim()) return;
    setUser((prev) => ({
      ...prev,
      name: draftName.trim(),
      email: draftEmail.trim(),
    }));
    setIsProfileModalOpen(false);
    setToastMessage('Perfil atualizado com sucesso.');
  };

  const handleLogout = () => {
    setIsProfileModalOpen(false);
    setLoginName(user.name);
    setLoginEmail(user.email);
    setLoginPassword('');
    setLoginError(null);
    setUser((prev) => ({ ...prev, isLoggedIn: false }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Informe seu e-mail e senha para acessar a Central de FAQ.');
      return;
    }
    setLoginError(null);
    setUser((prev) => ({
      ...prev,
      isLoggedIn: true,
      name: loginName.trim() || 'Usuário Comprove',
      email: loginEmail.trim(),
    }));
    setToastMessage('Sessão iniciada na Comprove.');
  };

  const scrollToSection = (sectionId: string, expandAll?: boolean) => {
    if (typeof expandAll === 'boolean') setShowAllFaqs(expandAll);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resolvedCount = resolutionCounts['Resolvido'] ?? 0;
  const openCount =
    (resolutionCounts['Pendente'] ?? 0) + (resolutionCounts['Em Análise'] ?? 0);

  // Access Gate: User must be logged in to access the FAQ page
  if (!user.isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F6EE] px-4 py-12 text-[#1E2B22]">
        <div className="w-full max-w-md rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] p-8 shadow-sm">
          <div className="flex items-center gap-3">
            {!logoImgFailed ? (
              <img
                src="/comprover-logo.png"
                alt="Comprove"
                onError={() => setLogoImgFailed(true)}
                className="h-9 w-9 rounded-full object-contain"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D6A45] text-sm font-bold text-[#F9FAF5]">
                C
              </span>
            )}
            <div>
              <span className="block text-lg font-bold tracking-tight text-[#11140d]">
                Comprove
              </span>
              <span className="block text-xs text-[#5E6B60]">
                Acesso restrito · Central de FAQ
              </span>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#11140d]">
            Faça login para acessar as Perguntas Frequentes
          </h1>
          <p className="mt-2 text-sm text-[#5E6B60]">
            Entre com sua conta da Comprove para consultar o Top 10 de resoluções e registrar
            novas ocorrências.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {loginError && (
              <div
                role="alert"
                className="rounded-xl border border-[#DC2626]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]"
              >
                {loginError}
              </div>
            )}

            <div>
              <label htmlFor="login-name" className="block text-xs font-semibold text-[#1E2B22]">
                Nome
              </label>
              <input
                id="login-name"
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="Seu nome"
                className="mt-1.5 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
              />
            </div>

            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#1E2B22]">
                E-mail corporativo
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="voce@comprove.com.br"
                className="mt-1.5 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#1E2B22]"
              >
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="mt-1.5 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2D6A45] px-5 text-sm font-semibold text-[#F9FAF5] transition-colors hover:bg-[#245a3a]"
            >
              <LogIn className="h-4 w-4" />
              Entrar na Central de FAQ
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#F6F6EE] text-[#1E2B22]">
      {/* Top Bar Contract: Zone 1 Brand — Zone 2 Nav Links — Zone 3 Switcher + Primary Action + Profile Icon */}
      <header className="sticky top-0 z-40 border-b border-[#D6DCC8] bg-[#FDFDF9]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:gap-8 sm:px-6">
          {/* Zone 1: Single-line Brand Wordmark with Lateral Fade-in */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45]"
          >
            {!logoImgFailed ? (
              <img
                src="/comprover-logo.png"
                alt="Comprove"
                onError={() => setLogoImgFailed(true)}
                className="h-7 w-7 shrink-0 rounded-full object-contain"
              />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D6A45] text-xs font-bold text-[#F9FAF5]">
                C
              </span>
            )}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="text-base font-bold tracking-tight text-[#11140d]"
            >
              Comprove
            </motion.span>
          </button>

          {/* Zone 2: Clean Single-Line Text Navigation Links */}
          {activePage === 'faq' ? (
            <nav
              aria-label="Navegação principal do FAQ"
              className="hidden items-center gap-7 text-sm font-medium text-[#5E6B60] md:flex"
            >
              <button
                type="button"
                onClick={() => scrollToSection('entrada-faq')}
                className="shrink-0 whitespace-nowrap transition-colors hover:text-[#11140d] hover:underline hover:underline-offset-4"
              >
                Início
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('filtros-resolucao')}
                className="shrink-0 whitespace-nowrap transition-colors hover:text-[#11140d] hover:underline hover:underline-offset-4"
              >
                Resoluções
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('lista-faqs', false)}
                className="shrink-0 whitespace-nowrap transition-colors hover:text-[#11140d] hover:underline hover:underline-offset-4"
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('lista-faqs', true)}
                className="shrink-0 whitespace-nowrap transition-colors hover:text-[#11140d] hover:underline hover:underline-offset-4"
              >
                Todos os FAQs
              </button>
            </nav>
          ) : (
            <nav
              aria-label="Navegação principal do Help Desk"
              className="hidden items-center gap-7 text-sm font-medium text-[#5E6B60] md:flex"
            >
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="shrink-0 whitespace-nowrap font-semibold text-[#11140d] underline underline-offset-4"
              >
                Chamados Help Desk
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPage('faq')}
                className="shrink-0 whitespace-nowrap transition-colors hover:text-[#11140d] hover:underline hover:underline-offset-4"
              >
                Central de FAQ
              </button>
            </nav>
          )}

          {/* Zone 3: Page Switcher + Primary CTA + Profile Icon */}
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() =>
                handleSwitchPage(activePage === 'faq' ? 'helpdesk' : 'faq')
              }
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#D6DCC8] bg-[#FDFDF9] px-3.5 py-2 text-xs font-semibold text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:bg-[#EDF3EE] hover:text-[#2D6A45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45] sm:text-sm"
            >
              {activePage === 'faq' ? (
                <>
                  <Headset className="h-4 w-4 text-[#2D6A45]" />
                  <span>Help Desk</span>
                  <span className="font-mono-tabular text-xs font-bold text-[#2D6A45]">
                    ({openTicketCount})
                  </span>
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 text-[#2D6A45]" />
                  <span>Ir para FAQ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#2D6A45] px-4 py-2 text-sm font-semibold text-[#F9FAF5] transition-colors hover:bg-[#245a3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45]"
            >
              <HelpCircle className="h-4 w-4" />
              {activePage === 'faq' ? (
                <>
                  <span className="hidden lg:inline">Não encontrou sua resposta?</span>
                  <span className="lg:hidden">Nova dúvida</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Abrir Chamado</span>
                  <span className="sm:hidden">Chamado</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setDraftName(user.name);
                setDraftEmail(user.email);
                setIsProfileModalOpen(true);
              }}
              title="Perfil do usuário e foto"
              aria-label="Perfil do usuário e foto"
              className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D6DCC8] bg-[#EDF3EE] text-[#2D6A45] transition-colors hover:border-[#2D6A45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45]"
            >
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-[#11140d]/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-[#2D6A45]/30 bg-[#1E2B22] px-4 py-3 text-sm font-medium text-[#F9FAF5] shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E8C75A]" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Fechar aviso"
            className="ml-1 text-[#F9FAF5]/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {activePage === 'helpdesk' ? (
        <HelpDeskPage
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={(id) => setSelectedTicketId(id)}
          currentUserName={user.name}
          onUpdateTicketMeta={handleUpdateTicketMeta}
          onAddMessage={handleAddTicketMessage}
          onResolveAndSyncFaq={handleResolveTicketAndSyncFaq}
          onOpenNewTicketModal={() => setIsCreateModalOpen(true)}
          onSwitchToFaq={(faqId) => handleSwitchPage('faq', faqId)}
          onOpenImage={(url, title) => setLightboxImage({ url, title })}
        />
      ) : (
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        {/* ENTRADA DO FAQ (HERO) */}
        <section
          id="entrada-faq"
          className="grid grid-cols-1 items-stretch gap-8 border-b border-[#D6DCC8] pb-10 lg:grid-cols-12"
        >
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs font-semibold tracking-wide text-[#2D6A45]"
              >
                Comprove · Central de FAQ e Ocorrências
              </motion.p>
              <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
                <motion.span
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="block text-[#2D6A45]"
                >
                  PERGUNTAS
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="block text-[#11140d]"
                >
                  FREQUENTES
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 max-w-xl text-base leading-relaxed text-[#5E6B60]"
              >
                Consulte o Top 10 de dúvidas e incidentes mais perguntados na Comprove,
                filtre pelo status de resolução ou abra um novo registro com captura de tela.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 'some' }}
              transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 space-y-4"
            >
              {/* Entrada CTA + Buscar por Escrita */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#2D6A45] px-5 text-sm font-semibold text-[#F9FAF5] transition-colors hover:bg-[#245a3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45]"
                >
                  <HelpCircle className="h-4 w-4" />
                  Não encontrou sua resposta?
                </button>

                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6B60]"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por escrita..."
                    aria-label="Buscar por escrita no FAQ"
                    className="h-11 w-full rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] pl-10 pr-4 text-sm text-[#1E2B22] placeholder:text-[#5E6B60]/70 focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
                  />
                </div>
              </div>

              {/* Unboxed Operational Summary Line */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5E6B60]">
                <span className="tabular-nums">
                  <strong className="font-semibold text-[#1E2B22]">{faqs.length}</strong>{' '}
                  FAQs cadastrados
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  <strong className="font-semibold text-[#2D6A45]">{resolvedCount}</strong>{' '}
                  resolvidos
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  <strong className="font-semibold text-[#E0732A]">{openCount}</strong> em
                  análise ou pendentes
                </span>
              </div>
            </motion.div>
          </div>

          {/* Animated Crowd & Resolution Signal Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="h-full min-h-[400px] overflow-hidden rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] lg:min-h-[440px]">
              <ColdEmailCrowdHero className="h-full min-h-[400px] lg:min-h-[440px]" />
            </div>
          </motion.div>
        </section>

        {/* APENAS FILTROS DE RESOLUÇÃO + BUSCA */}
        <motion.section
          id="filtros-resolucao"
          aria-label="Filtros de resolução"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] p-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#5E6B60]">
                <ListFilter className="h-3.5 w-3.5" />
                Resolução:
              </span>
              {(['Todos', ...RESOLUTION_STATUSES] as const).map((status) => {
                const active = resolutionFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setResolutionFilter(status)}
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
                      {resolutionCounts[status] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] px-3.5 py-2 text-xs font-medium text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:text-[#2D6A45]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            )}
          </div>
        </motion.section>

        {/* CONTEÚDO PRINCIPAL: TOP 10 + FAQ 11 SPLIT PANE */}
        <section id="lista-faqs" className="mt-7">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#D6DCC8] pb-3"
          >
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[#11140d]">
                {showAllFaqs ? 'Top 10 e Demais FAQs' : 'Top 10 FAQs Mais Perguntados'}
              </h2>
              <p className="mt-0.5 tabular-nums text-xs text-[#5E6B60]">
                Exibindo {displayedFaqs.length} de {filteredAndSortedFaqs.length}{' '}
                {filteredAndSortedFaqs.length === 1 ? 'registro' : 'registros'}
                {hasActiveFilters ? ' no Top 10 filtrado' : ''}
              </p>
            </div>

            {filteredAndSortedFaqs.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllFaqs((prev) => !prev)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#D6DCC8] bg-[#FDFDF9] px-3 py-1.5 text-xs font-semibold text-[#2D6A45] transition-colors hover:border-[#2D6A45] hover:bg-[#EDF3EE]"
              >
                {showAllFaqs ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Mostrar Top 10
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Ver todos ({filteredAndSortedFaqs.length})
                  </>
                )}
              </button>
            )}
          </motion.div>

          {displayedFaqs.length === 0 ? (
            <div className="rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] px-6 py-12 text-center">
              <FileQuestion className="mx-auto h-10 w-10 text-[#5E6B60]" />
              <h3 className="mt-3 text-base font-semibold text-[#11140d]">
                Nenhum FAQ encontrado para esse filtro
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#5E6B60]">
                Tente alterar o status de resolução, limpar a busca ou registre esta dúvida
                na central.
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
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A45] px-4 py-2 text-sm font-semibold text-[#F9FAF5] hover:bg-[#245a3a]"
                >
                  <HelpCircle className="h-4 w-4" />
                  Não encontrou sua resposta?
                </button>
              </div>
            </div>
          ) : (
            <FaqSplitPane
              items={displayedFaqs}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              showRankNumbers={true}
              onUpvote={handleUpvote}
              onOpenImage={(url, title) => setLightboxImage({ url, title })}
              upvotedIds={upvotedIds}
            />
          )}

          {/* Ver Mais / Listar Todos Button below Top 10 */}
          {filteredAndSortedFaqs.length > 10 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 'some' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 flex items-center justify-center border-t border-[#D6DCC8] pt-6"
            >
              <button
                type="button"
                onClick={() => setShowAllFaqs((prev) => !prev)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-[#D6DCC8] bg-[#FDFDF9] px-6 py-3 text-sm font-semibold text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:bg-[#EDF3EE] hover:text-[#2D6A45]"
              >
                {showAllFaqs ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Recolher para o Top 10 mais perguntados
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Ver mais — Listar todos os {filteredAndSortedFaqs.length} FAQs
                  </>
                )}
              </button>
            </motion.div>
          )}
        </section>
      </main>
      )}

      {/* Clean Comprove Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 'some' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="border-t border-[#D6DCC8] bg-[#FDFDF9]"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-6 text-xs text-[#5E6B60] sm:flex-row sm:items-center sm:px-6">
          <div>
            <span className="font-semibold text-[#1E2B22]">Comprove</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Central de FAQ e Atendimento Help Desk</span>
          </div>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[#5E6B60] underline-offset-4 hover:text-[#2D6A45] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar dados iniciais
          </button>
        </div>
      </motion.footer>

      {/* Pop-up Create New FAQ Modal */}
      <CreateFaqModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateFaq}
      />

      {/* Profile & Photo Upload Modal */}
      {isProfileModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#11140d]/55 p-4 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#D6DCC8] bg-[#F6F6EE] px-6 py-4">
              <div>
                <p className="text-xs font-semibold text-[#2D6A45]">Conta autenticada</p>
                <h2
                  id="profile-modal-title"
                  className="text-lg font-semibold text-[#11140d]"
                >
                  Perfil do Usuário
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                aria-label="Fechar perfil"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6DCC8] bg-[#FDFDF9] text-[#1E2B22] hover:border-[#2D6A45] hover:text-[#2D6A45]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Avatar Photo Uploader */}
              <div className="flex items-center gap-4 border-b border-[#D6DCC8] pb-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D6DCC8] bg-[#EDF3EE] text-[#2D6A45]">
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-7 w-7" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#11140d]">Foto de Perfil</p>
                  <p className="mt-0.5 text-xs text-[#5E6B60]">
                    PNG, JPG ou WebP até 4 MB
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => profileFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D6A45] px-3 py-1.5 text-xs font-semibold text-[#F9FAF5] hover:bg-[#245a3a]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {user.photoUrl ? 'Trocar foto' : 'Inserir foto'}
                    </button>
                    {user.photoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setUser((prev) => ({ ...prev, photoUrl: undefined }))
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DC2626]/30 bg-white px-2.5 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    )}
                  </div>
                  <input
                    ref={profileFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="sr-only"
                    aria-label="Selecionar foto do perfil"
                  />
                </div>
              </div>

              <form onSubmit={handleSaveProfileDetails} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="block text-xs font-semibold text-[#1E2B22]"
                  >
                    Nome exibido
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2 text-sm text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-email"
                    className="block text-xs font-semibold text-[#1E2B22]"
                  >
                    E-mail
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    required
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2 text-sm text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#D6DCC8] pt-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#DC2626]/30 bg-white px-3.5 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair da conta
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#2D6A45] px-4 py-2 text-xs font-semibold text-[#F9FAF5] hover:bg-[#245a3a]"
                  >
                    Salvar Perfil
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da imagem"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#11140d]/80 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between gap-4 px-1">
              <p className="truncate text-sm font-semibold text-[#11140d]">
                {lightboxImage.title}
              </p>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="Fechar visualização"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D6DCC8] text-[#1E2B22] hover:border-[#2D6A45] hover:text-[#2D6A45]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              referrerPolicy="no-referrer"
              className="max-h-[78vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
    </MotionConfig>
  );
}

export default App;
