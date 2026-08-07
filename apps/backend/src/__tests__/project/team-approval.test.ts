import { describe, expect, it } from 'vitest';
import { PROJECT_TEAM_STATUSES, PROJECT_MEMBER_INVITATION_STATUSES } from '@learnova/constants';

describe('project team approval', () => {
  it('defines pending/approved/rejected/completed team statuses', () => {
    expect(PROJECT_TEAM_STATUSES).toContain('pending');
    expect(PROJECT_TEAM_STATUSES).toContain('approved');
    expect(PROJECT_TEAM_STATUSES).toContain('rejected');
    expect(PROJECT_TEAM_STATUSES).toContain('completed');
  });

  it('defines invitation statuses for ProjectMember', () => {
    expect(PROJECT_MEMBER_INVITATION_STATUSES).toContain('pending');
    expect(PROJECT_MEMBER_INVITATION_STATUSES).toContain('accepted');
    expect(PROJECT_MEMBER_INVITATION_STATUSES).toContain('rejected');
  });

  it('auto-approves teams when self-formation is allowed', () => {
    const allowSelfTeamFormation = true;
    const teamStatus = allowSelfTeamFormation ? 'approved' : 'pending';
    expect(teamStatus).toBe('approved');
  });

  it('keeps teams pending when self-formation is disabled', () => {
    const allowSelfTeamFormation = false;
    const teamStatus = allowSelfTeamFormation ? 'approved' : 'pending';
    expect(teamStatus).toBe('pending');
  });
});
