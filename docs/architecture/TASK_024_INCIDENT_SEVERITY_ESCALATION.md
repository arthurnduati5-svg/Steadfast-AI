# Task 024 Incident Severity and Escalation

## Severity Levels
- sev0: School-wide safety or privacy incident
- sev1: Major learning or identity outage
- sev2: Degraded core learning
- sev3: Limited feature degradation
- sev4: Low priority

## Escalation Rules
- Privacy boundary failure → at least sev1
- Safeguarding raw exposure → sev0
- Cross-school data exposure → sev0
- School auth outage → sev1 or sev0
- Source governance failure → sev2 or higher
- AI egress failure → sev1 or sev0

## Escalation Paths
- sev0: Immediate escalation to executive and safety team
- sev1: Escalation to engineering lead within 30 minutes
- sev2: Escalation to team lead within 2 hours
- sev3: Logged for next business day review
- sev4: Logged for weekly review
