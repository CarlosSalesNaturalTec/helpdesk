## Why

The system is expanding from an IT-focused Helpdesk to a Shared Services Center (CSC). We need to support ticket creation and resolution across multiple business sectors (IT, Maintenance, Cleaning, etc.), allowing each sector to define its own problem types and resolution times (SLAs), and ensuring that technicians only see requests relevant to their department.

## What Changes

- Add a generic `Sector` entity for departments.
- Add a `ProblemType` entity tied to a specific `Sector`, defining the SLA for that problem.
- Link Technicians to exactly one `Sector`.
- Update the ticket creation flow to require the selection of a `Sector` and a corresponding `ProblemType` using cascading dropdowns.
- Update dashboards and ticket queries to securely filter and show only the tickets from the technician's assigned sector.

## Capabilities

### New Capabilities
- `sector-management`: Admin functionality to CRUD Sectors and their associated Problem Types.

### Modified Capabilities
- `ticket-creation`: Ticket now requires `Sector` and `ProblemType` selection.
- `user-management`: Technicians must be assigned to a `Sector` upon creation or edit.
- `dashboard`: Technician dashboards are filtered by the technician's `Sector`.
- `ticket-query`: Ticket listing API and UI must enforce sector-based filtering for technicians.

## Impact

- Database schema: New `Sector` and `ProblemType` models, relationships added to `User` and `Ticket`.
- API endpoints: New endpoints for Sectors/ProblemTypes; updated user and ticket routes.
- Frontend: New admin pages for Sectors; cascading dropdown logic in ticket forms; filtering in dashboards.
- Existing IT categories will be migrated manually to the new `ProblemType` structure (since system is in testing).

## Non-goals

- Allowing a single technician to belong to multiple sectors.
- Automated data migration of existing categories (manual recreation is acceptable during the test phase).
- Cross-sector ticket transfers (if a ticket is opened in the wrong sector, it may need to be closed and reopened, or handled simply for now).
