export class GovernorError extends Error {
  constructor(message, exitCode) {
    super(message);
    this.name = 'GovernorError';
    this.exitCode = exitCode;
  }
}

export class ManifestValidationError extends GovernorError {
  constructor(message) {
    super(message, 11);
    this.name = 'ManifestValidationError';
  }
}

export class EvidenceIntegrityError extends GovernorError {
  constructor(message) {
    super(message, 12);
    this.name = 'EvidenceIntegrityError';
  }
}

export class WorkspaceScopeError extends GovernorError {
  constructor(message) {
    super(message, 13);
    this.name = 'WorkspaceScopeError';
  }
}

export class TestInventoryError extends GovernorError {
  constructor(message) {
    super(message, 14);
    this.name = 'TestInventoryError';
  }
}

export class CommitOrderError extends GovernorError {
  constructor(message) {
    super(message, 15);
    this.name = 'CommitOrderError';
  }
}

export class CommandTimeoutError extends GovernorError {
  constructor(message) {
    super(message, 16);
    this.name = 'CommandTimeoutError';
  }
}

export class FinalizationError extends GovernorError {
  constructor(message) {
    super(message, 17);
    this.name = 'FinalizationError';
  }
}

export class ExternalBlockerError extends GovernorError {
  constructor(message) {
    super(message, 18);
    this.name = 'ExternalBlockerError';
  }
}
