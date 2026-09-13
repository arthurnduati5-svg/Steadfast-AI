import type { CurriculumFamily, CurriculumVersion, CurriculumVersionStatus } from './task022ContentGovernanceContracts';

export interface VersionEntry {
  version: CurriculumVersion;
  migrationNotes?: string;
}

export class CurriculumVersioningService {
  private versions: Map<string, VersionEntry[]> = new Map();

  registerVersion(family: CurriculumFamily, version: CurriculumVersion, migrationNotes?: string): void {
    const key = family;
    if (!this.versions.has(key)) this.versions.set(key, []);
    const entries = this.versions.get(key)!;
    const existing = entries.findIndex(e => e.version.id === version.id);
    if (existing >= 0) {
      entries[existing] = { version, migrationNotes };
    } else {
      entries.push({ version, migrationNotes });
    }
  }

  getVersion(versionId: string): CurriculumVersion | null {
    for (const [, entries] of this.versions) {
      const entry = entries.find(e => e.version.id === versionId);
      if (entry) return entry.version;
    }
    return null;
  }

  getActiveVersion(family: CurriculumFamily, schoolId?: string): CurriculumVersion | null {
    const entries = this.versions.get(family);
    if (!entries) return null;

    if (schoolId) {
      const schoolActive = entries.find(e =>
        e.version.status === 'active' && e.version.schoolId === schoolId
      );
      if (schoolActive) return schoolActive.version;
    }

    const globalActive = entries.find(e => e.version.status === 'active' && !e.version.schoolId);
    return globalActive ? globalActive.version : null;
  }

  setVersionStatus(versionId: string, status: CurriculumVersionStatus): boolean {
    for (const [, entries] of this.versions) {
      const entry = entries.find(e => e.version.id === versionId);
      if (entry) {
        entry.version.status = status;
        return true;
      }
    }
    return false;
  }

  getVersionsForFamily(family: CurriculumFamily): CurriculumVersion[] {
    const entries = this.versions.get(family);
    return entries ? entries.map(e => e.version) : [];
  }

  getDeprecatedVersions(family: CurriculumFamily): CurriculumVersion[] {
    return this.getVersionsForFamily(family).filter(v => v.status === 'deprecated');
  }

  getBlockedVersions(family: CurriculumFamily): CurriculumVersion[] {
    return this.getVersionsForFamily(family).filter(v => v.status === 'blocked');
  }

  isVersionActive(versionId: string, schoolId?: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;
    if (version.status === 'blocked' || version.status === 'archived' || version.status === 'deprecated') return false;
    return true;
  }

  getMigrationNotes(versionId: string): string | undefined {
    for (const [, entries] of this.versions) {
      const entry = entries.find(e => e.version.id === versionId);
      if (entry) return entry.migrationNotes;
    }
    return undefined;
  }

  getVersionCount(): number {
    let count = 0;
    for (const [, entries] of this.versions) {
      count += entries.length;
    }
    return count;
  }

  reset(): void {
    this.versions.clear();
  }
}

export const curriculumVersioningService = new CurriculumVersioningService();
