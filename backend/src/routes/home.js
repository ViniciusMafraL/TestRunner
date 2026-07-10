import { Router } from 'express';
import { getHomeSummary } from '../repositories/issuesRepository.js';
import { asyncHandler } from '../asyncHandler.js';

export const homeRouter = Router();

homeRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    res.json(await getHomeSummary(req.operation, req.project));
  }),
);
