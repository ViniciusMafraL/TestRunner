import { Router } from 'express';
import { listTestRuns, createTestRun, updateTestRunStatus } from '../repositories/testRunsRepository.js';
import { requireWrite } from '../authMiddleware.js';
import { asyncHandler } from '../asyncHandler.js';

export const testRunsRouter = Router();

testRunsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ demands: await listTestRuns(req.operation) });
  }),
);

testRunsRouter.post(
  '/',
  requireWrite,
  asyncHandler(async (req, res) => {
    const demand = await createTestRun(req.operation, req.body ?? {});
    res.status(201).json(demand);
  }),
);

testRunsRouter.patch(
  '/:id/status',
  requireWrite,
  asyncHandler(async (req, res) => {
    const demand = await updateTestRunStatus(req.operation, req.params.id, req.body?.status);
    res.json(demand);
  }),
);
