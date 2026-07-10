import { beforeEach, describe, expect, it } from 'vitest';
import { getOperations, getProjects, addProject } from '../../src/api/mock/operations.js';
import { getIssuesGroupedByStatus } from '../../src/api/mock/issues.js';
import { resetStore, setCurrentOperationForMock, setCurrentProjectForMock } from '../../src/api/mock/store.js';

function allTitles(groups) {
  return groups.flatMap((group) => group.issues).map((issue) => issue.title);
}

describe('operações e projetos (contract)', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });

  it('GET /operations lista as operações disponíveis (com tagValues)', async () => {
    const { operations } = await getOperations();
    expect(operations.map((op) => op.id)).toEqual(['sportia', 'roblox', 'fortnite', 'gameloft']);
    expect(operations.find((op) => op.id === 'sportia').tagValues).toEqual(['Hub', 'Futebol', 'Menu']);
  });

  it('os dados trocam conforme a operação/projeto atuais', async () => {
    // Sportia: projeto único (a aba), com todas as issues.
    const sportia = await getIssuesGroupedByStatus();
    expect(allTitles(sportia.groups)).toContain('Crash ao abrir o Hub em dispositivos Android');

    // Roblox: cai no primeiro projeto (Mini-game X).
    setCurrentOperationForMock('roblox');
    const robloxX = await getIssuesGroupedByStatus();
    expect(allTitles(robloxX.groups)).toContain('Lobby do mini-game X não carrega skins');
    expect(allTitles(robloxX.groups)).not.toContain('Crash ao abrir o Hub em dispositivos Android');

    // Trocar de aba (projeto) troca as issues.
    setCurrentProjectForMock('Mini-game Y');
    const robloxY = await getIssuesGroupedByStatus();
    expect(allTitles(robloxY.groups)).toContain('Botão de compra sobreposto no mini-game Y');
    expect(allTitles(robloxY.groups)).not.toContain('Lobby do mini-game X não carrega skins');
  });

  it('GET /operations/:op/projects retorna os projetos (abas) da operação', async () => {
    const { projects } = await getProjects('sportia');
    expect(projects).toEqual(['Sportia']);

    const roblox = await getProjects('roblox');
    expect(roblox.projects).toEqual(['Mini-game X', 'Mini-game Y']);
  });

  it('POST /operations/:op/projects adiciona um projeto (aba) novo', async () => {
    const { projects } = await addProject('sportia', 'Loja');
    expect(projects).toContain('Loja');
    const after = await getProjects('sportia');
    expect(after.projects).toContain('Loja');
  });

  it('rejeita projeto com nome vazio', async () => {
    await expect(addProject('sportia', '   ')).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
  });
});
