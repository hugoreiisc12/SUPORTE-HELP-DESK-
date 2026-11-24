import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  ThumbsUp,
  Image as ImageIcon,
  ChevronRight,
  FileCheck2,
  Heart,
  PartyPopper,
} from 'lucide-react';
import { FaqItem, ResolutionStatus } from '../types/faq';
import { Reactions, Reaction, ReactionOption } from './ui/reactions';

const FAQ_REACTION_OPTIONS: ReactionOption[] = [
  {
    id: 'doubt',
    label: 'Também tenho essa dúvida',
    activeLabel: 'Dúvida contabilizada',
    icon: ThumbsUp,
  },
  {
    id: 'clarified',
    label: 'Esclareceu minha dúvida',
    activeLabel: 'Dúvida esclarecida',
    icon: CheckCircle2,
  },
  {
    id: 'helpful',
    label: 'Muito útil',
    activeLabel: 'Marcado como útil',
    icon: Heart,
  },
  {
    id: 'celebrate',
    label: 'Resolvido!',
    activeLabel: 'Resolvido!',
    icon: PartyPopper,
  },
];

const REACTIONS_STORAGE_KEY = 'comprove_faq_extra_reactions_v1';

interface FaqSplitPaneProps {
  items: FaqItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showRankNumbers: boolean;
  onUpvote: (id: string) => void;
  onOpenImage: (url: string, title: string) => void;
  upvotedIds: string[];
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

export const FaqSplitPane: React.FC<FaqSplitPaneProps> = ({
  items,
  selectedId,
  onSelect,
  showRankNumbers,
  onUpvote,
  onOpenImage,
  upvotedIds,
}) => {
  const activeItem = items.find((item) => item.id === selectedId) ?? items[0];

  const [extraReactionsByFaq, setExtraReactionsByFaq] = useState<
    Record<string, Reaction[]>
  >(() => {
    try {
      const saved = localStorage.getItem(REACTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore storage read failure
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        REACTIONS_STORAGE_KEY,
        JSON.stringify(extraReactionsByFaq)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [extraReactionsByFaq]);

  if (!activeItem) return null;

  const resMeta = getResolutionDisplay(activeItem.resolutionStatus);
  const ResIcon = resMeta.icon;
  const hasUpvoted = upvotedIds.includes(activeItem.id);
  const extraReactions = extraReactionsByFaq[activeItem.id] ?? [];
  const combinedReactions: Reaction[] = [
    {
      id: 'doubt',
      count: activeItem.askCount,
      reacted: hasUpvoted,
    },
    ...extraReactions,
  ];

  const handleReactionsChange = (
    next: Reaction[],
    change: { id: string; reacted: boolean }
  ) => {
    if (change.id === 'doubt') {
      onUpvote(activeItem.id);
      return;
    }
    const nextExtras = next.filter((r) => r.id !== 'doubt');
    setExtraReactionsByFaq((prev) => ({
      ...prev,
      [activeItem.id]: nextExtras,
    }));
  };

  const handleSelectItem = (item: FaqItem) => {
    onSelect(item.id);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      {/* Left Pane: Question List */}
      <div
        role="listbox"
        aria-label="Lista de perguntas frequentes"
        className="space-y-2 lg:col-span-5"
      >
        {items.map((item, idx) => {
          const isSelected = item.id === activeItem.id;
          const itemRes = getResolutionDisplay(item.resolutionStatus);
          const ItemResIcon = itemRes.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 'some' }}
              transition={{
                duration: 0.38,
                delay: Math.min(idx * 0.04, 0.28),
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => handleSelectItem(item)}
              className={`group flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45] ${
                isSelected
                  ? 'border-[#2D6A45] bg-[#EDF3EE]/75'
                  : 'border-[#D6DCC8] bg-[#FDFDF9] hover:border-[#2D6A45]/45'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#5E6B60]">
                  <span className="font-mono-tabular font-semibold text-[#2D6A45]">
                    {showRankNumbers
                      ? `${String(idx + 1).padStart(2, '0')}.`
                      : item.code}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={`inline-flex items-center gap-1 font-medium ${itemRes.textClass}`}>
                    <ItemResIcon className="h-3 w-3 shrink-0" />
                    {item.resolutionStatus}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{item.askCount}x</span>
                </div>

                <h3
                  className={`mt-1 text-sm font-semibold leading-snug ${
                    isSelected ? 'text-[#11140d]' : 'text-[#1E2B22]'
                  }`}
                >
                  {item.title}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[#5E6B60]">
                  <span>{item.problemField}</span>
                  {item.imageUrl && (
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

      {/* Right Pane: Signed Answer Pane (FAQ 11) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 'some' }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="lg:sticky lg:top-24 lg:col-span-7"
      >
        <AnimatePresence mode="wait">
          <motion.article
            key={activeItem.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] p-6"
          >
            {/* Unboxed Header Metadata */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-[#D6DCC8] pb-4 text-xs text-[#5E6B60]">
              <span className="font-mono-tabular font-semibold text-[#11140d]">
                {activeItem.code}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeItem.problemField}</span>
              <span aria-hidden="true">·</span>
              <span>{activeItem.bugType}</span>
              <span aria-hidden="true">·</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${resMeta.textClass}`}>
                <ResIcon className="h-3.5 w-3.5 shrink-0" />
                {activeItem.resolutionStatus}
              </span>
            </div>

            {/* Question Title */}
            <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-[#11140d]">
              {activeItem.title}
            </h3>

            {/* Problem Description */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold tracking-wide text-[#5E6B60]">
                Descrição do Problema
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-[#1E2B22]">
                {activeItem.problemDescription}
              </p>
            </div>

            {/* Official Resolution Box (Read-only for users, controlled by Help Desk) */}
            <div
              className={`mt-5 rounded-xl border border-[#D6DCC8] p-4 ${resMeta.surfaceTint}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ResIcon className={`h-4 w-4 ${resMeta.textClass}`} />
                  <h4 className="text-sm font-semibold text-[#11140d]">
                    Resposta & Resolução — {activeItem.resolutionStatus}
                  </h4>
                </div>
                <span className="text-[11px] font-medium text-[#5E6B60]">
                  Definido pelo Help Desk
                </span>
              </div>

              <p className="mt-2.5 text-sm leading-relaxed text-[#1E2B22]">
                {activeItem.resolutionText}
              </p>
            </div>

            {/* Attached Visual Evidence (if present) */}
            {activeItem.imageUrl && (
              <div className="mt-5">
                <h4 className="text-xs font-semibold text-[#5E6B60]">
                  Evidência Visual Anexada
                </h4>
                <button
                  type="button"
                  onClick={() => onOpenImage(activeItem.imageUrl!, activeItem.title)}
                  className="group mt-1.5 block w-full overflow-hidden rounded-xl border border-[#D6DCC8] bg-white text-left transition-colors hover:border-[#2D6A45]"
                >
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.imageName || activeItem.title}
                    referrerPolicy="no-referrer"
                    className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-[#5E6B60]">
                    <span className="truncate">
                      {activeItem.imageName || 'evidencia.png'}
                    </span>
                    <span className="shrink-0 font-medium text-[#2D6A45]">Ampliar</span>
                  </div>
                </button>
              </div>
            )}

            {/* Signed Answer Footer (Signature Pane) */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#D6DCC8] pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D6DCC8] bg-[#EDF3EE] text-[#2D6A45]">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-editorial text-sm italic text-[#11140d]">
                    Comprove · Suporte Operacional
                  </p>
                  <p className="tabular-nums text-[11px] text-[#5E6B60]">
                    Assinado e revisado em {formatDateBr(activeItem.updatedAt)}
                  </p>
                </div>
              </div>

              <Reactions
                options={FAQ_REACTION_OPTIONS}
                value={combinedReactions}
                onValueChange={handleReactionsChange}
                label="Reações e dúvidas contabilizadas"
                showPrimaryText={true}
              />
            </div>
          </motion.article>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
