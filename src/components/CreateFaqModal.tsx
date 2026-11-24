import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  BUG_TYPES,
  BugType,
  FaqItem,
  PROBLEM_FIELDS,
  ProblemField,
  SeverityLevel,
} from '../types/faq';

interface CreateFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (faq: Omit<FaqItem, 'id' | 'code' | 'askCount' | 'createdAt' | 'updatedAt'>) => void;
}

interface QuizOption {
  id: string;
  label: string;
  score: number;
}

const IMPACT_OPTIONS: QuizOption[] = [
  { id: 'imp-3', label: 'Bloqueia completamente pedidos, entregas ou faturamento', score: 3 },
  { id: 'imp-2', label: 'Atrasa o processo, mas existe alternativa manual', score: 2 },
  { id: 'imp-1', label: 'Causa desconforto visual ou dúvida pontual sem bloqueio', score: 1 },
];

const SCOPE_OPTIONS: QuizOption[] = [
  { id: 'scp-3', label: 'Toda a equipe / múltiplas unidades afetadas', score: 3 },
  { id: 'scp-2', label: 'Um setor, filial ou rota específica', score: 2 },
  { id: 'scp-1', label: 'Apenas meu usuário / caso isolado', score: 1 },
];

const FREQUENCY_OPTIONS: QuizOption[] = [
  { id: 'frq-2', label: 'Ocorre sempre que executo a ação', score: 2 },
  { id: 'frq-1', label: 'Ocorre de forma intermitente', score: 1 },
  { id: 'frq-0', label: 'Ocorreu apenas uma vez até o momento', score: 0 },
];

function computeSeverity(totalScore: number): {
  level: SeverityLevel;
  description: string;
  colorClass: string;
} {
  if (totalScore >= 7) {
    return {
      level: 'Crítica',
      description: 'Bloqueio operacional severo · Prioridade imediata de engenharia',
      colorClass: 'text-[#DC2626]',
    };
  }
  if (totalScore >= 5) {
    return {
      level: 'Alta',
      description: 'Alto impacto na rotina · Atendimento prioritário no mesmo dia',
      colorClass: 'text-[#E0732A]',
    };
  }
  if (totalScore >= 3) {
    return {
      level: 'Média',
      description: 'Impacto moderado com contorno possível · Fila regular',
      colorClass: 'text-[#9A6B0A]',
    };
  }
  return {
    level: 'Baixa',
    description: 'Dúvida ou ajuste pontual sem bloqueio operacional',
    colorClass: 'text-[#2D6A45]',
  };
}

export const CreateFaqModal: React.FC<CreateFaqModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemField, setProblemField] = useState<ProblemField>('Pedidos do Campo');
  const [specificScreen, setSpecificScreen] = useState('');
  const [bugType, setBugType] = useState<BugType>('Falha de Sincronização');
  const [bugSubType, setBugSubType] = useState('');

  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageName, setImageName] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const [impactId, setImpactId] = useState<string>('imp-2');
  const [scopeId, setScopeId] = useState<string>('scp-2');
  const [frequencyId, setFrequencyId] = useState<string>('frq-1');
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedImpact = IMPACT_OPTIONS.find((o) => o.id === impactId) ?? IMPACT_OPTIONS[1];
  const selectedScope = SCOPE_OPTIONS.find((o) => o.id === scopeId) ?? SCOPE_OPTIONS[1];
  const selectedFrequency =
    FREQUENCY_OPTIONS.find((o) => o.id === frequencyId) ?? FREQUENCY_OPTIONS[1];

  const totalScore = selectedImpact.score + selectedScope.score + selectedFrequency.score;
  const severityInfo = computeSeverity(totalScore);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('A imagem deve ter no máximo 5 MB.');
      return;
    }
    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setProblemDescription('');
    setProblemField('Pedidos do Campo');
    setSpecificScreen('');
    setBugType('Falha de Sincronização');
    setBugSubType('');
    setImageUrl(undefined);
    setImageName(undefined);
    setImpactId('imp-2');
    setScopeId('scp-2');
    setFrequencyId('frq-1');
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) {
      setFormError('Preencha a Descrição do Problema antes de registrar o FAQ.');
      return;
    }

    const derivedTitle =
      title.trim() ||
      problemDescription.trim().split(/[.!?\n]/)[0].slice(0, 92) +
        (problemDescription.trim().length > 92 ? '...' : '');

    onSubmit({
      title: derivedTitle,
      problemDescription: problemDescription.trim(),
      problemField,
      specificScreen: specificScreen.trim() || 'Tela geral do módulo',
      bugType,
      bugSubType: bugSubType.trim() || 'Ocorrência reportada pelo usuário',
      resolutionStatus: 'Pendente',
      resolutionText:
        'Solicitação registrada e encaminhada ao suporte Help Desk. Aguardando triagem e definição oficial do suporte.',
      severity: severityInfo.level,
      severityScore: totalScore,
      severityBreakdown: {
        impactLabel: selectedImpact.label,
        scopeLabel: selectedScope.label,
        frequencyLabel: selectedFrequency.label,
      },
      imageUrl,
      imageName,
    });

    resetForm();
    onClose();
  };

  const SeverityIcon =
    severityInfo.level === 'Crítica'
      ? AlertOctagon
      : severityInfo.level === 'Alta'
        ? AlertTriangle
        : severityInfo.level === 'Média'
          ? ShieldAlert
          : Info;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#11140d]/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-faq-modal-title"
      onClick={onClose}
      onPaste={handlePaste}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#D6DCC8] bg-[#FDFDF9] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#D6DCC8] bg-[#F6F6EE] px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#2D6A45]">
              Novo registro na base de conhecimento
            </p>
            <h2
              id="create-faq-modal-title"
              className="mt-1 text-xl font-semibold tracking-tight text-[#11140d]"
            >
              Criar Novo FAQ / Registrar Ocorrência
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D6DCC8] bg-[#FDFDF9] text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:text-[#2D6A45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {formError && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]"
              >
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Título Resumido */}
            <div>
              <label
                htmlFor="faq-title"
                className="block text-sm font-semibold text-[#1E2B22]"
              >
                Pergunta ou Título Resumido
              </label>
              <p className="mt-0.5 text-xs text-[#5E6B60]">
                Como esta dúvida deve aparecer na lista de FAQs (opcional — se vazio, será gerado da descrição).
              </p>
              <input
                id="faq-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Erro ao sincronizar pedido finalizado no campo sem sinal 4G"
                className="mt-2 w-full rounded-xl border border-[#D6DCC8] bg-white px-4 py-2.5 text-sm text-[#1E2B22] placeholder:text-[#5E6B60]/60 focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
              />
            </div>

            {/* DESCRIÇÃO DO PROBLEMA */}
            <div>
              <label
                htmlFor="faq-description"
                className="block text-sm font-semibold text-[#1E2B22]"
              >
                Descrição do Problema <span className="text-[#DC2626]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[#5E6B60]">
                Explique o comportamento observado, o passo a passo que levou ao erro ou o contexto da dúvida.
              </p>
              <textarea
                id="faq-description"
                rows={4}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Descreva detalhadamente o problema encontrado no Portal JFC..."
                className="mt-2 w-full rounded-xl border border-[#D6DCC8] bg-white px-4 py-3 text-sm leading-relaxed text-[#1E2B22] placeholder:text-[#5E6B60]/60 focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
              />
            </div>

            {/* CAMPO DO PROBLEMA + Tela/Campo Específico */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="faq-problem-field"
                  className="block text-sm font-semibold text-[#1E2B22]"
                >
                  Campo do Problema <span className="text-[#DC2626]">*</span>
                </label>
                <p className="mt-0.5 text-xs text-[#5E6B60]">Módulo principal do portal</p>
                <select
                  id="faq-problem-field"
                  value={problemField}
                  onChange={(e) => setProblemField(e.target.value as ProblemField)}
                  className="mt-2 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
                >
                  {PROBLEM_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="faq-specific-screen"
                  className="block text-sm font-semibold text-[#1E2B22]"
                >
                  Tela ou Campo Específico
                </label>
                <p className="mt-0.5 text-xs text-[#5E6B60]">Onde exatamente o erro ocorre</p>
                <input
                  id="faq-specific-screen"
                  type="text"
                  value={specificScreen}
                  onChange={(e) => setSpecificScreen(e.target.value)}
                  placeholder="Ex: Botão Finalizar Pedido, Coluna Data"
                  className="mt-2 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] placeholder:text-[#5E6B60]/60 focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
                />
              </div>
            </div>

            {/* TIPO DE BUG OU ERRO (Categoria + Subtipo/Detalhe) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="faq-bug-type"
                  className="block text-sm font-semibold text-[#1E2B22]"
                >
                  Tipo de Bug ou Erro <span className="text-[#DC2626]">*</span>
                </label>
                <p className="mt-0.5 text-xs text-[#5E6B60]">Classificação técnica da falha</p>
                <select
                  id="faq-bug-type"
                  value={bugType}
                  onChange={(e) => setBugType(e.target.value as BugType)}
                  className="mt-2 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
                >
                  {BUG_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="faq-bug-subtype"
                  className="block text-sm font-semibold text-[#1E2B22]"
                >
                  Detalhe / Sintoma do Bug ou Erro
                </label>
                <p className="mt-0.5 text-xs text-[#5E6B60]">Código de erro ou comportamento</p>
                <input
                  id="faq-bug-subtype"
                  type="text"
                  value={bugSubType}
                  onChange={(e) => setBugSubType(e.target.value)}
                  placeholder="Ex: Botão travado, erro HTTP 500, cálculo divergente"
                  className="mt-2 w-full rounded-xl border border-[#D6DCC8] bg-white px-3.5 py-2.5 text-sm text-[#1E2B22] placeholder:text-[#5E6B60]/60 focus:border-[#2D6A45] focus:outline-none focus:ring-2 focus:ring-[#2D6A45]/20"
                />
              </div>
            </div>

            {/* CAMPO DE INSERÇÃO DE IMAGEM */}
            <div>
              <span className="block text-sm font-semibold text-[#1E2B22]">
                Campo de Inserção de Imagem (Print ou Evidência)
              </span>
              <p className="mt-0.5 text-xs text-[#5E6B60]">
                Arraste uma captura de tela, clique para selecionar ou cole direto da área de transferência (Ctrl+V).
              </p>

              {!imageUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-7 text-center transition-colors ${
                    isDragging
                      ? 'border-[#2D6A45] bg-[#EDF3EE]'
                      : 'border-[#D6DCC8] bg-[#F6F6EE]/70 hover:border-[#2D6A45] hover:bg-[#EDF3EE]/50'
                  }`}
                >
                  <UploadCloud className="h-7 w-7 text-[#2D6A45]" />
                  <p className="mt-2 text-sm font-medium text-[#1E2B22]">
                    Clique para enviar ou arraste a imagem aqui
                  </p>
                  <p className="mt-1 text-xs text-[#5E6B60]">
                    PNG, JPG ou WebP até 5 MB · Suporte a Ctrl+V
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-3 rounded-xl border border-[#D6DCC8] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt={imageName || 'Pré-visualização do erro'}
                      className="h-16 w-24 rounded-lg border border-[#D6DCC8] object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[#1E2B22]">
                        <ImageIcon className="h-4 w-4 shrink-0 text-[#2D6A45]" />
                        <span className="truncate">{imageName || 'captura_anexada.png'}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#2D6A45]">
                        Imagem pronta para ser anexada ao FAQ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="whitespace-nowrap rounded-lg border border-[#D6DCC8] bg-[#FDFDF9] px-3 py-1.5 text-xs font-medium text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:text-[#2D6A45]"
                    >
                      Trocar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(undefined);
                        setImageName(undefined);
                      }}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#DC2626]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Selecionar arquivo de imagem"
              />
            </div>

            {/* QUESTÕES DE MÚLTIPLA ESCOLHA PARA DEFINIR A SEVERIDADE DO PROBLEMA */}
            <div className="rounded-xl border border-[#D6DCC8] bg-[#F6F6EE]/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D6DCC8] pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#11140d]">
                    Classificação de Severidade do Problema
                  </h3>
                  <p className="mt-0.5 text-xs text-[#5E6B60]">
                    Responda às 3 questões de múltipla escolha abaixo para definir automaticamente a severidade.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[#D6DCC8] bg-[#FDFDF9] px-3 py-2">
                  <SeverityIcon className={`h-4 w-4 shrink-0 ${severityInfo.colorClass}`} />
                  <span className={`text-sm font-bold ${severityInfo.colorClass}`}>
                    Severidade {severityInfo.level}
                  </span>
                  <span className="font-mono-tabular text-xs text-[#5E6B60]">
                    ({totalScore}/8 pts)
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-5">
                {/* Pergunta 1 */}
                <fieldset>
                  <legend className="text-xs font-semibold text-[#1E2B22]">
                    1. Qual o impacto do problema na operação diária?
                  </legend>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {IMPACT_OPTIONS.map((opt) => {
                      const active = impactId === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs transition-colors ${
                            active
                              ? 'border-[#2D6A45] bg-[#EDF3EE] font-medium text-[#11140d]'
                              : 'border-[#D6DCC8] bg-[#FDFDF9] text-[#1E2B22] hover:border-[#2D6A45]/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="severity-impact"
                            value={opt.id}
                            checked={active}
                            onChange={() => setImpactId(opt.id)}
                            className="h-4 w-4 accent-[#2D6A45]"
                          />
                          <span className="flex-1">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Pergunta 2 */}
                <fieldset>
                  <legend className="text-xs font-semibold text-[#1E2B22]">
                    2. Quantos usuários ou unidades são afetados?
                  </legend>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {SCOPE_OPTIONS.map((opt) => {
                      const active = scopeId === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs transition-colors ${
                            active
                              ? 'border-[#2D6A45] bg-[#EDF3EE] font-medium text-[#11140d]'
                              : 'border-[#D6DCC8] bg-[#FDFDF9] text-[#1E2B22] hover:border-[#2D6A45]/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="severity-scope"
                            value={opt.id}
                            checked={active}
                            onChange={() => setScopeId(opt.id)}
                            className="h-4 w-4 accent-[#2D6A45]"
                          />
                          <span className="flex-1">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Pergunta 3 */}
                <fieldset>
                  <legend className="text-xs font-semibold text-[#1E2B22]">
                    3. Com que frequência o erro acontece?
                  </legend>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {FREQUENCY_OPTIONS.map((opt) => {
                      const active = frequencyId === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                            active
                              ? 'border-[#2D6A45] bg-[#EDF3EE] font-medium text-[#11140d]'
                              : 'border-[#D6DCC8] bg-[#FDFDF9] text-[#1E2B22] hover:border-[#2D6A45]/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="severity-frequency"
                            value={opt.id}
                            checked={active}
                            onChange={() => setFrequencyId(opt.id)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2D6A45]"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <p className="mt-4 text-xs text-[#5E6B60]">{severityInfo.description}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-[#D6DCC8] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap rounded-xl border border-[#D6DCC8] bg-white px-5 py-2.5 text-sm font-medium text-[#1E2B22] transition-colors hover:border-[#2D6A45] hover:text-[#2D6A45]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#2D6A45] px-6 py-2.5 text-sm font-semibold text-[#F9FAF5] transition-colors hover:bg-[#245a3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A45]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Publicar FAQ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
