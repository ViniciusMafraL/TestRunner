import { Router } from 'express';
import { getIssuesGroupedByStatus, createIssue, updateIssueStatus, updateIssue } from '../repositories/issuesRepository.js';
import { asyncHandler } from '../asyncHandler.js';

export const issuesRouter = Router();

issuesRouter.get(
  '/grouped-by-status',
  asyncHandler(async (req, res) => {
    res.json(await getIssuesGroupedByStatus());
  }),
);

issuesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const issue = await createIssue(req.body ?? {});
    res.status(201).json(issue);
  }),
);

issuesRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const issue = await updateIssueStatus(req.params.id, req.body?.status);
    res.json(issue);
  }),
);

issuesRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const issue = await updateIssue(req.params.id, req.body ?? {});
    res.json(issue);
  }),
);
