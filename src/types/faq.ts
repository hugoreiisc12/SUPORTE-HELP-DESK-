export type ResolutionStatus =
  | 'Resolvido'
  | 'Em Análise'
  | 'Solução de Contorno'
  | 'Pendente';

export type SeverityLevel = 'Crítica' | 'Alta' | 'Média' | 'Baixa';

export type BugType =
  | 'Falha de Sincronização'
  | 'Erro de Interface (UI)'
  | 'Erro de Dados / Cálculo'
  | 'Lentidão / Performance'
  | 'Erro de Permissão / Acesso'
  | 'Falha em Planilha / NF-e'
  | 'Dúvida Operacional';

export type ProblemField =
  | 'Pedidos do Campo'
  | 'Logística & Rotas'
  | 'Agendas & Entregas'
  | 'Canhotos & NF-e'
  | 'Rastreamento / SAC'
  | 'App Mobile Offline'
  | 'Cadastro & Permissões'
  | 'Importação Excel / Planilhas';

export interface SeverityDiagnosticBreakdown {
  impactLabel: string;
  scopeLabel: string;
  frequencyLabel: string;
}

export interface FaqItem {
  id: string;
  code: string;
  title: string;
  problemDescription: string;
  problemField: ProblemField;
  specificScreen: string;
  bugType: BugType;
  bugSubType: string;
  resolutionStatus: ResolutionStatus;
  resolutionText: string;
  severity: SeverityLevel;
  severityScore: number;
  severityBreakdown: SeverityDiagnosticBreakdown;
  askCount: number;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  imageName?: string;
}

export const PROBLEM_FIELDS: ProblemField[] = [
  'Pedidos do Campo',
  'Logística & Rotas',
  'Agendas & Entregas',
  'Canhotos & NF-e',
  'Rastreamento / SAC',
  'App Mobile Offline',
  'Cadastro & Permissões',
  'Importação Excel / Planilhas',
];

export const BUG_TYPES: BugType[] = [
  'Falha de Sincronização',
  'Erro de Interface (UI)',
  'Erro de Dados / Cálculo',
  'Lentidão / Performance',
  'Erro de Permissão / Acesso',
  'Falha em Planilha / NF-e',
  'Dúvida Operacional',
];

export const RESOLUTION_STATUSES: ResolutionStatus[] = [
  'Resolvido',
  'Solução de Contorno',
  'Em Análise',
  'Pendente',
];

export const SEVERITY_LEVELS: SeverityLevel[] = [
  'Crítica',
  'Alta',
  'Média',
  'Baixa',
];
