import { describe, expect, it } from 'vitest';
import { Status } from '../../shared/enums.js';
import {
  NEW_ACCOUNT_ROLE,
  allowedStatusTargetsForRole,
  canRoleSetStatus,
  loginRoleFor,
  roleCanAccessSection,
} from '../../shared/contracts.js';

describe('papéis — navegação por seção', () => {
  it('admin/qa acessam qualquer seção', () => {
    for (const role of ['admin', 'qa']) {
      expect(roleCanAccessSection(role, '/home')).toBe(true);
      expect(roleCanAccessSection(role, '/reporter')).toBe(true);
      expect(roleCanAccessSection(role, '/test-run')).toBe(true);
      expect(roleCanAccessSection(role, '/test-plan')).toBe(true);
    }
  });

  it('developer/viewer/convidado só acessam Home e Issue Tracker', () => {
    for (const role of ['developer', 'viewer', 'guest', undefined]) {
      expect(roleCanAccessSection(role, '/home')).toBe(true);
      expect(roleCanAccessSection(role, '/issue-tracker')).toBe(true);
      expect(roleCanAccessSection(role, '/reporter')).toBe(false);
      expect(roleCanAccessSection(role, '/test-run')).toBe(false);
      expect(roleCanAccessSection(role, '/test-plan')).toBe(false);
    }
  });
});

describe('papéis — opções de status do seletor', () => {
  it('admin/qa veem o enum completo', () => {
    expect(allowedStatusTargetsForRole('admin', 'Open')).toEqual(Status);
    expect(allowedStatusTargetsForRole('qa', 'Fixed')).toEqual(Status);
  });

  it('developer em issue Open: In progress, To review e Fixed For Next Build', () => {
    expect(allowedStatusTargetsForRole('developer', 'Open')).toEqual([
      'In progress',
      'To review',
      'Fixed For Next Build',
    ]);
  });

  it('developer em In progress/To review: só Fixed For Next Build', () => {
    expect(allowedStatusTargetsForRole('developer', 'In progress')).toEqual(['Fixed For Next Build']);
    expect(allowedStatusTargetsForRole('developer', 'To review')).toEqual(['Fixed For Next Build']);
  });

  it('developer devolve ao QA quando a build sai: Fixed For Next Build → To review', () => {
    expect(allowedStatusTargetsForRole('developer', 'Fixed For Next Build')).toEqual(['To review']);
  });

  it('developer não edita status já resolvidos/fechados', () => {
    expect(allowedStatusTargetsForRole('developer', 'Fixed')).toEqual([]);
    expect(allowedStatusTargetsForRole('developer', 'Closed')).toEqual([]);
    expect(allowedStatusTargetsForRole('developer', 'By Design')).toEqual([]);
  });

  it('viewer/convidado não têm opções (somente leitura)', () => {
    expect(allowedStatusTargetsForRole('viewer', 'Open')).toEqual([]);
    expect(allowedStatusTargetsForRole('guest', 'Open')).toEqual([]);
  });
});

describe('papéis — imposição de gravação de status', () => {
  it('admin/qa gravam qualquer valor, inclusive fora do enum (ex.: Arquivado)', () => {
    expect(canRoleSetStatus('admin', 'Open', 'Fixed')).toBe(true);
    expect(canRoleSetStatus('admin', 'Fixed', 'Arquivado')).toBe(true);
    expect(canRoleSetStatus('qa', 'In progress', 'Arquivado')).toBe(true);
  });

  it('developer move Open→In progress/To review/Fixed For Next Build', () => {
    expect(canRoleSetStatus('developer', 'Open', 'In progress')).toBe(true);
    expect(canRoleSetStatus('developer', 'Open', 'To review')).toBe(true);
    expect(canRoleSetStatus('developer', 'Open', 'Fixed For Next Build')).toBe(true);
    expect(canRoleSetStatus('developer', 'Open', 'Fixed')).toBe(false);
    expect(canRoleSetStatus('developer', 'In progress', 'To review')).toBe(false);
  });

  it('developer marca Fixed For Next Build a partir de In progress e To review', () => {
    expect(canRoleSetStatus('developer', 'In progress', 'Fixed For Next Build')).toBe(true);
    expect(canRoleSetStatus('developer', 'To review', 'Fixed For Next Build')).toBe(true);
    // Mas não a partir de um status fora do alcance dele.
    expect(canRoleSetStatus('developer', 'Fixed', 'Fixed For Next Build')).toBe(false);
  });

  it('developer devolve Fixed For Next Build ao QA, mas não a fecha sozinho', () => {
    expect(canRoleSetStatus('developer', 'Fixed For Next Build', 'To review')).toBe(true);
    expect(canRoleSetStatus('developer', 'Fixed For Next Build', 'Fixed')).toBe(false);
    expect(canRoleSetStatus('developer', 'Fixed For Next Build', 'Closed')).toBe(false);
  });

  it('viewer/convidado não gravam nada', () => {
    expect(canRoleSetStatus('viewer', 'Open', 'In progress')).toBe(false);
    expect(canRoleSetStatus('guest', 'Open', 'In progress')).toBe(false);
  });
});

describe('conta nova', () => {
  it('nasce como developer', () => {
    expect(NEW_ACCOUNT_ROLE).toBe('developer');
  });
});

describe('papel efetivo no login (loginRoleFor)', () => {
  it('célula vazia (ou só espaços) vira developer', () => {
    expect(loginRoleFor('')).toBe('developer');
    expect(loginRoleFor('   ')).toBe('developer');
    expect(loginRoleFor(undefined)).toBe('developer');
  });

  it('papel reconhecido é mantido (case-insensitive)', () => {
    expect(loginRoleFor('admin')).toBe('admin');
    expect(loginRoleFor('QA')).toBe('qa');
    expect(loginRoleFor('developer')).toBe('developer');
    expect(loginRoleFor('viewer')).toBe('viewer');
  });

  it('papel não reconhecido cai em viewer (ex.: "prod")', () => {
    expect(loginRoleFor('prod')).toBe('viewer');
  });
});
