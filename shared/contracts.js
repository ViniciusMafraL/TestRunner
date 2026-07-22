import { Status } from './enums.js';

// `project` NÃO entra aqui: agora é derivado da aba (página) selecionada da
// planilha da operação, não um campo digitado. O backend/mock carimba o
// project = nome da aba ao criar/devolver a issue.
export const ISSUE_REQUIRED_FIELDS = ['title', 'version'];
export const ISSUE_OPTIONAL_FIELDS = [
  'severity',
  'tag',
  'description',
  'attachment',
  'foundBy',
  'platform',
  'keywords',
  'store',
];
export const ISSUE_DEFAULT_STATUS = 'Open';

/**
 * Campos aceitos por PATCH /issues/:id (edição pela janela de detalhes).
 * `id`, `status` e `createdIn` ficam de fora: id/createdIn são imutáveis e
 * status tem endpoint próprio (PATCH /issues/:id/status).
 */
export const ISSUE_EDITABLE_FIELDS = [...ISSUE_REQUIRED_FIELDS, ...ISSUE_OPTIONAL_FIELDS];

/**
 * Limites de evidências (POST /issues/:id/evidence) — fonte única usada pela
 * UI (validação antes do envio), pelo mock e pelo backend (multer).
 * 100 MB por arquivo: teto do túnel trycloudflare atual por request.
 */
export const EVIDENCE_MAX_FILES = 5;
export const EVIDENCE_MAX_FILE_SIZE_MB = 100;
export const EVIDENCE_ACCEPTED_MIME_PREFIXES = ['video/', 'image/'];

/**
 * Valida uma lista de arquivos de evidência ({ name, size, type }, o shape do
 * File do browser). Retorna { valid } ou { valid: false, error } no mesmo
 * formato dos demais validadores deste módulo.
 */
export function validateEvidenceFiles(files) {
  const list = Array.from(files ?? []);
  if (list.length === 0) {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Nenhum arquivo de evidência informado' } };
  }
  if (list.length > EVIDENCE_MAX_FILES) {
    return {
      valid: false,
      error: { code: 'VALIDATION_ERROR', message: `No máximo ${EVIDENCE_MAX_FILES} arquivos de evidência por issue` },
    };
  }
  for (const file of list) {
    const type = String(file?.type ?? '');
    if (!EVIDENCE_ACCEPTED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) {
      return {
        valid: false,
        error: { code: 'VALIDATION_ERROR', message: `Tipo de arquivo não aceito: ${file?.name ?? (type || 'desconhecido')} — apenas vídeos e imagens` },
      };
    }
    if (Number(file?.size ?? 0) > EVIDENCE_MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        valid: false,
        error: { code: 'VALIDATION_ERROR', message: `${file?.name ?? 'Arquivo'} excede o limite de ${EVIDENCE_MAX_FILE_SIZE_MB} MB` },
      };
    }
  }
  return { valid: true };
}

export const TEST_RUN_REQUIRED_FIELDS = ['build', 'version', 'testType', 'responsible', 'platform'];
export const TEST_RUN_DEFAULT_STATUS = 'Pendente';

export function validateIssuePayload(payload) {
  const missing = ISSUE_REQUIRED_FIELDS.filter((field) => !payload?.[field]);
  if (missing.length > 0) {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Title e Version são obrigatórios', missing } };
  }
  return { valid: true };
}

/**
 * Valida o corpo de PATCH /issues/:id e extrai apenas os campos editáveis
 * (campos protegidos ou desconhecidos são descartados, conforme contrato).
 * Retorna `{ valid: true, patch }` com o patch já filtrado.
 */
export function validateIssueUpdatePayload(payload) {
  const patch = {};
  for (const field of ISSUE_EDITABLE_FIELDS) {
    if (payload && Object.prototype.hasOwnProperty.call(payload, field)) {
      patch[field] = payload[field];
    }
  }
  if (Object.keys(patch).length === 0) {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Nenhum campo editável informado' } };
  }
  const missing = ISSUE_REQUIRED_FIELDS.filter((field) => field in patch && !patch[field]);
  if (missing.length > 0) {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Title e Version são obrigatórios', missing } };
  }
  return { valid: true, patch };
}

export function validateTestRunPayload(payload) {
  const missing = TEST_RUN_REQUIRED_FIELDS.filter((field) => !payload?.[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      error: { code: 'VALIDATION_ERROR', message: 'Build, Version, tipo de teste, responsável e plataforma são obrigatórios', missing },
    };
  }
  return { valid: true };
}

/**
 * Papéis do sistema (aba da planilha separada de usuários) e o que cada um
 * pode. Escrita completa (criar issue, editar campos, projetos, evidência) é só
 * de admin/qa (WRITE_ROLES). `developer` é somente leitura na maior parte da
 * ferramenta, com uma exceção pontual: mover issues `Open` para In progress/To
 * review no Issue Tracker (ver allowedStatusTargetsForRole). `viewer` e
 * convidado só leem. O papel de um e-mail é editado direto na planilha de
 * usuários — sem deploy.
 */
export const USER_ROLES = ['admin', 'qa', 'developer', 'viewer'];
export const WRITE_ROLES = ['admin', 'qa'];
// Papel de toda conta Google nova (antes era 'viewer'). Ver upsertUserOnLogin.
export const NEW_ACCOUNT_ROLE = 'developer';

export function roleCanWrite(role) {
  return WRITE_ROLES.includes(role);
}

/**
 * Papel efetivo no login a partir da célula "Role" da planilha. Célula **vazia**
 * (conta ainda sem papel atribuído) adota o baseline `developer` — assim contas
 * novas E contas antigas sem papel entram como desenvolvedor. Papel reconhecido
 * é mantido; valor não reconhecido cai em `viewer` (menor privilégio).
 */
export function loginRoleFor(rawRole) {
  const role = String(rawRole ?? '').trim().toLowerCase();
  if (role === '') return NEW_ACCOUNT_ROLE;
  return USER_ROLES.includes(role) ? role : 'viewer';
}

/**
 * Navegação por papel. admin/qa têm as 5 telas; os demais (developer, viewer,
 * convidado) veem só Home + Issue Tracker. Fonte única usada pelo menu lateral
 * (esconder links) e pelo gate de rota (bloquear URL direta).
 */
export const RESTRICTED_SECTIONS = ['/home', '/issue-tracker'];

export function roleHasFullNav(role) {
  return WRITE_ROLES.includes(role);
}

export function roleCanAccessSection(role, basePath) {
  return roleHasFullNav(role) || RESTRICTED_SECTIONS.includes(basePath);
}

/**
 * Transições do developer, por status atual. Ele pega uma issue Open (In
 * progress/To review) e, quando resolve algo que só sai numa próxima build,
 * marca "Fixed For Next Build" — a partir de Open, In progress ou To review.
 * Quando a build sai, ele devolve a issue ao QA (Fixed For Next Build → To
 * review); quem valida o reteste é sempre o QA. Status atual que não está neste
 * mapa é somente leitura para o developer.
 */
const DEVELOPER_TARGETS = {
  Open: ['In progress', 'To review', 'Fixed For Next Build'],
  'In progress': ['Fixed For Next Build'],
  'To review': ['Fixed For Next Build'],
  'Fixed For Next Build': ['To review'],
};

/**
 * Opções de status que o seletor da UI oferece a um papel, a partir do status
 * atual da issue. admin/qa veem o enum completo; developer segue
 * DEVELOPER_TARGETS; viewer/convidado não editam (lista vazia = pílula somente
 * leitura). Para a imposição no servidor use canRoleSetStatus.
 */
export function allowedStatusTargetsForRole(role, currentStatus) {
  if (role === 'admin' || role === 'qa') return Status;
  if (role === 'developer') return DEVELOPER_TARGETS[currentStatus] ?? [];
  return [];
}

/**
 * Pode este papel gravar `nextStatus` numa issue que está em `currentStatus`?
 * Imposição do servidor (e do mock). admin/qa gravam QUALQUER valor — inclusive
 * fora do enum (ex.: "Arquivado" do arquivamento em lote), preservando o
 * contrato de "aceita dado sujo". Os demais seguem a lista de opções do papel.
 */
export function canRoleSetStatus(role, currentStatus, nextStatus) {
  if (role === 'admin' || role === 'qa') return true;
  return allowedStatusTargetsForRole(role, currentStatus).includes(nextStatus);
}

/**
 * Operações que um usuário acessa. Aceita array ou string separada por vírgula
 * (formato da coluna "Operations" na planilha de controle). `*` = todas.
 */
export function parseOperationsList(value) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function userCanAccessOperation(allowedOperations, operationId) {
  if (!operationId) return false;
  const list = parseOperationsList(allowedOperations);
  return list.includes('*') || list.includes(operationId);
}

export function validateLoginPayload(payload) {
  if (payload?.type === 'google') {
    if (typeof payload.credential !== 'string' || payload.credential.trim() === '') {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Credencial do Google ausente' } };
    }
    return { valid: true };
  }
  if (payload?.type === 'guest') {
    if (typeof payload.name !== 'string' || payload.name.trim() === '') {
      return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Nome é obrigatório' } };
    }
    return { valid: true };
  }
  return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Tipo de login inválido' } };
}
