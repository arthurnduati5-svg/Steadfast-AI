export interface RecoveryExecutionReadinessBoardFilterPreset {
  boardFilterPresetId: string;
  schoolId: string;
  actorId?: string;
  actorRole?: string;
  presetName: string;
  presetStatus: string;
  filterCriteriaJson?: Record<string, any>;
  laneFiltersJson?: Record<string, any>;
  statusFiltersJson?: Record<string, any>;
  riskFiltersJson?: Record<string, any>;
  priorityFiltersJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFilterPresetRequest {
  schoolId: string;
  actorId?: string;
  actorRole?: string;
  presetName: string;
  presetStatus?: string;
  filterCriteriaJson?: Record<string, any>;
  laneFiltersJson?: Record<string, any>;
  statusFiltersJson?: Record<string, any>;
  riskFiltersJson?: Record<string, any>;
  priorityFiltersJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}
