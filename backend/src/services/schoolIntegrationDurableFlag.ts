let useDurable = false;

export function useDurableSchoolIntegration(): boolean {
  return useDurable;
}

export function enableDurableSchoolIntegration(): void {
  useDurable = true;
}

export function disableDurableSchoolIntegration(): void {
  useDurable = false;
}
