import { Router } from 'express';
import { listTestRuns, createTestRun, updateTestRunStatus } from '../repositories/testRunsRepository.js';
import { asyncHandler } from '../asyncHandler.js';

export const testRunsRouter = Router();

testRunsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ demands: await listTestRuns() });
  }),
);

testRunsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const demand = await createTestRun(req.body ?? {});
    res.status(201).json(demand);
  }),
);

testRunsRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const demand = await updateTestRunStatus(req.params.id, req.body?.status);
    res.json(demand);
  }),
);
