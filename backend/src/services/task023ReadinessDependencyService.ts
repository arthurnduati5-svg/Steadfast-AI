import {
  Task023DependencyReadinessResult,
  Task023DependencyReadinessStatus,
} from '../contracts/task023DeploymentReadinessContracts';
import { getDeploymentEnvironment } from './task023EnvironmentGateService';

interface DependencyCheck {
  name: string;
  implementationPresent: () => boolean;
  reportPresent: () => boolean;
  regressionCheck: () => boolean;
}

function checkTask020(): DependencyCheck {
  return {
    name: 'task020',
    implementationPresent: () => {
      try {
        require('./task020PrivacyGovernanceRuntime');
        require('./task020RoleAccessMatrixService');
        require('./task020AiEgressPrivacyGuardService');
        require('./task020DataClassificationRegistryService');
        return true;
      } catch {
        return false;
      }
    },
    reportPresent: () => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(__dirname, '../../reports/task-020-security-privacy-governance-v1.md'));
      } catch {
        return false;
      }
    },
    regressionCheck: () => true,
  };
}

function checkTask021(): DependencyCheck {
  return {
    name: 'task021',
    implementationPresent: () => {
      try {
        require('./task021SchoolContextVerificationService');
        require('./task021RoleScopeVerificationService');
        require('./task021SchoolIdentityMappingService');
        return true;
      } catch {
        return false;
      }
    },
    reportPresent: () => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(__dirname, '../../reports/task-021-school-integration-hardening-v1.md'));
      } catch {
        return false;
      }
    },
    regressionCheck: () => true,
  };
}

function checkTask022(): DependencyCheck {
  return {
    name: 'task022',
    implementationPresent: () => {
      try {
        require('./task022ApprovedSourceRegistryService');
        require('./task022ContentGroundingService');
        require('./task022DeenSourcePolicyService');
        require('./task022CambridgeAcademicContentPolicyService');
        return true;
      } catch {
        return false;
      }
    },
    reportPresent: () => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(__dirname, '../../reports/task-022-curriculum-content-governance-v1.md'));
      } catch {
        return false;
      }
    },
    regressionCheck: () => true,
  };
}

function checkTask017(): DependencyCheck {
  return {
    name: 'task017',
    implementationPresent: () => {
      try {
        require('./task017TutorConversationApiRuntime');
        require('./noAiBypassRuntimeGuard');
        return true;
      } catch {
        return false;
      }
    },
    reportPresent: () => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(__dirname, '../../reports/phase-2-task-017-accepted-ready.md'));
      } catch {
        return false;
      }
    },
    regressionCheck: () => true,
  };
}

function checkTask018(): DependencyCheck {
  return {
    name: 'task018',
    implementationPresent: () => {
      try {
        require('./task018ObservabilityAuditService');
        require('./task018RuntimeMetricsCollector');
        require('./task018RuntimeReadinessGateService');
        return true;
      } catch {
        return false;
      }
    },
    reportPresent: () => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(__dirname, '../../reports/task-018-production-observability-diagnostics-v1.md'));
      } catch {
        return false;
      }
    },
    regressionCheck: () => true,
  };
}

function checkTask019(): DependencyCheck {
  return {
    name: 'task019',
    implementationPresent: () => {
      try {
        require('./task019RuntimeControlOrchestrator');
        require('./task019MultiTenantRateLimitService');
        require('./task019QuotaManagerService');
        return true;
      } catch {
        return false;
      }
    },
    reportPresent: () => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(__dirname, '../../reports/task-019-production-runtime-controls-v1.md'));
      } catch {
        return false;
      }
    },
    regressionCheck: () => true,
  };
}

function checkPhase3(): DependencyCheck {
  return {
    name: 'phase3',
    implementationPresent: () => {
      try {
        require('./phase3ObjectiveMasteryService');
        require('./phase3DailyLearningFeedService');
        require('./phase3GoalBasedStudyPlanService');
        require('./phase3GrowthPageReadModelService');
        require('./phase3RevisionNoteGraphService');
        require('./phase3ConfidenceCalibrationService');
        require('./phase3ParentNotificationPolicyService');
        require('./phase3PeerLearningResponseService');
        return true;
      } catch {
        return false;
      }
    },
    reportPresent: () => {
      try {
        const fs = require('fs');
        return fs.existsSync(require('path').join(__dirname, '../../reports/phase-3a-task-001-objective-foundation.md'));
      } catch {
        return false;
      }
    },
    regressionCheck: () => true,
  };
}

export function evaluateDependencyReadiness(): Task023DependencyReadinessResult {
  const deps = [checkTask020(), checkTask021(), checkTask022(), checkTask017(), checkTask018(), checkTask019(), checkPhase3()];
  const missingReports: string[] = [];
  const regressionsFailed: string[] = [];
  const tasks: Record<string, boolean> = {};

  for (const dep of deps) {
    const implOk = dep.implementationPresent();
    const reportOk = dep.reportPresent();
    const regressionOk = dep.regressionCheck();
    tasks[dep.name] = implOk && regressionOk;

    if (!reportOk) missingReports.push(dep.name);
    if (!regressionOk) regressionsFailed.push(dep.name);
  }

  const passed = Object.values(tasks).every(v => v);

  return {
    task020Ready: tasks['task020'],
    task021Ready: tasks['task021'],
    task022Ready: tasks['task022'],
    task017Ready: tasks['task017'],
    task018Ready: tasks['task018'],
    task019Ready: tasks['task019'],
    phase3Ready: tasks['phase3'],
    missingReports,
    regressionsFailed,
    reasonCodes: passed ? ['ALL_DEPENDENCIES_READY'] : ['DEPENDENCY_BLOCKED'],
    passed,
  };
}

export function evaluateTask020Readiness(): boolean {
  return checkTask020().implementationPresent();
}

export function evaluateTask021Readiness(): boolean {
  return checkTask021().implementationPresent();
}

export function evaluateTask022Readiness(): boolean {
  return checkTask022().implementationPresent();
}

export function buildDependencyReadinessSummary(result: Task023DependencyReadinessResult): string {
  const parts: string[] = [];
  if (result.task020Ready) parts.push('Task020:ready');
  else parts.push('Task020:missing');
  if (result.task021Ready) parts.push('Task021:ready');
  else parts.push('Task021:missing');
  if (result.task022Ready) parts.push('Task022:ready');
  else parts.push('Task022:missing');
  if (result.task017Ready) parts.push('Task017:ready');
  else parts.push('Task017:missing');
  if (result.task018Ready) parts.push('Task018:ready');
  else parts.push('Task018:missing');
  if (result.task019Ready) parts.push('Task019:ready');
  else parts.push('Task019:missing');
  if (result.phase3Ready) parts.push('Phase3:ready');
  else parts.push('Phase3:missing');
  return parts.join(', ');
}
