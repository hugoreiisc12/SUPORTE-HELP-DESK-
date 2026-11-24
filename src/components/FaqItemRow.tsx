import React, { useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ShieldAlert,
  Info,
  ThumbsUp,
  Image as ImageIcon,
  Edit3,
  Check,
} from 'lucide-react';
import {
  FaqItem,
  RESOLUTION_STATUSES,
  ResolutionStatus,
  SeverityLevel,
} from '../types/faq';

interface FaqItemRowProps {
  item: FaqItem;
  rankIndex?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpvote: (id: string) => void;
  onUpdateResolution: (
    id: string,
    status: ResolutionStatus,
    resolutionText: string
  ) => void;
  onOpenImage: (url: string, title: string) => void;
  hasUpvoted: boolean;
}

function getResolutionDisplay(status: ResolutionStatus) {
  switch (status) {
    case 'Resolvido':
      return {
        icon: CheckCircle2,
        textClass: 'text-[#2D6A45]',
        surfaceTint: 'bg-[#EDF3EE]/70',
      };
    case 'Solução de Contorno':
      return {
        icon: Wrench,
        textClass: 'text-[#9A6B0A]',
        surfaceTint: 'bg-[#FEF9EC]',
      };
    case 'Em Análise':
      return {
        icon: Clock,
        textClass: 'text-[#B45309]',
        surfaceTint: 'bg-[#FFF7ED]',
      };
    case 'Pendente':
    default:
      return {
        icon: AlertCircle,
        textClass: 'text-[#DC2626]',
        surfaceTint: 'bg-[#FEF2F2]/60',
      };
  }
}

function getSeverityDisplay(severity: SeverityLevel) {
  switch (severity) {
    case 'Crítica':
      return { icon: AlertOctagon, textClass: 'text-[#DC2626]' };
    case 'Alta':
      return { icon: AlertTriangle, textClass: 'text-[#E0732A]' };
    case 'Média':
      return { icon: ShieldAlert, textClass: 'text-[#9A6B0A]' };
    case 'Baixa':
    default:
      return { icon: Info, textClass: 'text-[#2D6A45]' };
  }
}

function formatDateBr(isoDate: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export const FaqItemRow: React.FC<FaqItemRowProps> = ({
  item,
  rankIndex,
  isExpanded,
  onToggle,
  onUpvote,
  onUpdateResolution,
  onOpenImage,
  hasUpvoted,
}) => {
  const [isEditingResolution, setIsEditingResolution] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ResolutionStatus>(item.resolutionStatus);
  const [draftText, setDraftText] = useState(item.resolutionText);

  const resMeta = getResolutionDisplay(item.resolutionStatus);
  const sevMeta = getSeverityDisplay(item.severity);
  const ResIcon = resMeta.icon;
  const SevIcon = sevMeta.icon;

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim()) return;
    onUpdateResolution(item.id, draftStatus, draftText.trim());
    setIsEditingResolution(false);
  };

  return (
    <article
      className={`rounded-xl border transition-colors duration-150 ${
        isExpanded
          ? 'border-[#2D6A45]/50 bg-[#FDFDF9]'
          : 'border-[#D6DCC8] bg-[#FDFDF9] hover:border-[#2D6A45]/45'
      }`}
    >
      {/* Accordion Trigger Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2D6A45]"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {typeof rankIndex === 'number' && (
            <span
              className="font-mono-tabular mt-0.5 shrink-0 text-sm font-medium text-[#2D6A45]"
              aria-label={`Posição ${rankIndex}`}
            >
              {String(rankIndex).padStart(2, '0')}.
            </span>
          )}

          <div className="min-w-0 flex-1">
            {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5E6B60]">
              <span className="font-mono-tabular font-medium text-[#1E2B22]">
                {item.code}
              </span>
              <span aria-hidden="true">·</span>
              <span>{item.problemField}</span>
              <span aria-hidden="true">·</span>
              <span>{item.bugType}</span>
              <span aria-hidden="true">·</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${resMeta.textClass}`}>
                <ResIcon className="h-3.5 w-3.5 shrink-0" />
                {item.resolutionStatus}
              </span>
              <span aria-hidden="true">·</span>
              <span className={`inline-flex items-center gap-1 font-medium ${sevMeta.textClass}`}>
                <SevIcon className="h-3.5 w-3.5 shrink-0" />
                Severidade {item.severity}
              </span>
            </div>

            <h3 className="mt-1.5 text-base font-semibold leading-snug text-[#11140d]">
              {item.title}
            </h3>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5E6B60]">
              <span className="tabular-nums font-medium text-[#1E2B22]">
                {item.askCount} perguntas registradas
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Atualizado em {formatDateBr(item.updatedAt)}</span>
              {item.imageUrl && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#2D6A45]">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Evidência anexada
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D6DCC8] text-[#1E2B22] transition-transform duration-150 ${
            isExpanded ? 'rotate-180 border-[#2D6A45]/40 bg-[#EDF3EE] text-[#2D6A45]' : ''
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-[#D6DCC8] px-5 pb-5 pt-4">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Main Details */}
            <div className="space-y-4 lg:col-span-8">
              <div>
                <h4 className="text-xs font-semibold tracking-wide text-[#5E6B60]">
                  Descrição do Problema
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[#1E2B22]">
                  {item.problemDescription}
                </p>
              </div>

              {/* Resolution Section */}
              <div className={`rounded-xl border border-[#D6DCC8] p-4 ${resMeta.surfaceTint}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ResIcon className={`h-4 w-4 ${resMeta.textClass}`} />
                    <h4 className="text-sm font-semibold text-[#11140d]">
                      Resolução — {item.resolutionStatus}
                    </h4>
                  </div>

                  {!isEditingResolution && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftStatus(item.resolutionStatus);
                        setDraftText(item.resolutionText);
                        setIsEditingResolution(true);
                      }}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#D6DCC8] bg-[#FDFDF9] px-2.5 py-1 text-xs font-medium text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:text-[#2D6A45]"
                    >
                      <Edit3 className="h-3 w-3" />
                      Atualizar Resolução
                    </button>
                  )}
                </div>

                {!isEditingResolution ? (
                  <p className="mt-2 text-sm leading-relaxed text-[#1E2B22]">
                    {item.resolutionText}
                  </p>
                ) : (
                  <form onSubmit={handleSaveResolution} className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1E2B22]">
                        Status da Resolução
                      </label>
                      <select
                        value={draftStatus}
                        onChange={(e) => setDraftStatus(e.target.value as ResolutionStatus)}
                        className="mt-1 w-full rounded-lg border border-[#D6DCC8] bg-white px-3 py-2 text-xs text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                      >
                        {RESOLUTION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1E2B22]">
                        Texto da Resolução / Orientação
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#D6DCC8] bg-white px-3 py-2 text-xs leading-relaxed text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingResolution(false)}
                        className="rounded-lg border border-[#D6DCC8] bg-white px-3 py-1.5 text-xs font-medium text-[#1E2B22]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-[#2D6A45] px-3 py-1.5 text-xs font-semibold text-[#F9FAF5] hover:bg-[#245a3a]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Salvar Resolução
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Technical Context & Attachment Column */}
            <div className="space-y-4 lg:col-span-4">
              <div className="rounded-xl border border-[#D6DCC8] bg-[#F6F6EE]/75 p-4 text-xs">
                <h4 className="font-semibold text-[#11140d]">Diagnóstico & Origem</h4>
                <dl className="mt-2.5 space-y-2 text-[#1E2B22]">
                  <div>
                    <dt className="text-[#5E6B60]">Campo do Problema</dt>
                    <dd className="font-medium">
                      {item.problemField} — {item.specificScreen}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5E6B60]">Tipo de Bug / Erro</dt>
                    <dd className="font-medium">
                      {item.bugType} · {item.bugSubType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5E6B60]">Critérios de Severidade ({item.severityScore}/8 pts)</dt>
                    <dd className="mt-0.5 space-y-0.5 text-[#5E6B60]">
                      <div>• {item.severityBreakdown.impactLabel}</div>
                      <div>• {item.severityBreakdown.scopeLabel}</div>
                      <div>• {item.severityBreakdown.frequencyLabel}</div>
                    </dd>
                  </div>
                </dl>
              </div>

              {item.imageUrl && (
                <div>
                  <h4 className="text-xs font-semibold text-[#5E6B60]">
                    Imagem Anexada
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenImage(item.imageUrl!, item.title)}
                    className="group mt-1.5 block w-full overflow-hidden rounded-xl border border-[#D6DCC8] bg-white text-left transition-colors hover:border-[#2D6A45]"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.imageName || item.title}
                      referrerPolicy="no-referrer"
                      className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="flex items-center justify-between px-3 py-2 text-xs text-[#5E6B60]">
                      <span className="truncate">{item.imageName || 'evidencia.png'}</span>
                      <span className="shrink-0 font-medium text-[#2D6A45]">Ampliar</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#D6DCC8] pt-3.5">
            <span className="tabular-nums text-xs text-[#5E6B60]">
              Registrado em {formatDateBr(item.createdAt)}
            </span>

            <button
              type="button"
              onClick={() => onUpvote(item.id)}
              disabled={hasUpvoted}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
                hasUpvoted
                  ? 'border-[#2D6A45]/40 bg-[#EDF3EE] text-[#2D6A45]'
                  : 'border-[#D6DCC8] bg-white text-[#1E2B22] hover:border-[#2D6A45] hover:text-[#2D6A45]'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>
                {hasUpvoted
                  ? `Dúvida contabilizada (${item.askCount})`
                  : `Também tenho essa dúvida (${item.askCount})`}
              </span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
