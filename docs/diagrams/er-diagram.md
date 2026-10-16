# GymFlow – Entity-Relationship Diagram

The diagrams use [Mermaid](https://mermaid.js.org/) and render automatically on GitHub and in VS Code's Markdown preview.

## Current schema (after Stage 2)

```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : "has"
    MEMBERSHIP_PLAN ||--o{ MEMBERSHIP : "sold as"

    USER {
        int id PK
        string email UK "unique, stored in lower case"
        string passwordHash "bcrypt hash, never the real password"
        string firstName
        string lastName
        Role role "ADMIN | TRAINER | MEMBER, default MEMBER"
        datetime createdAt
        datetime updatedAt
    }
    MEMBERSHIP_PLAN {
        int id PK
        string name UK "unique, ignoring letter case"
        int durationMonths "CHECK > 0"
        decimal price "DECIMAL(10,2), CHECK > 0"
        boolean isActive "deactivated instead of deleted"
        datetime createdAt
        datetime updatedAt
    }
    MEMBERSHIP {
        int id PK
        int userId FK "ON DELETE CASCADE"
        int planId FK "ON DELETE RESTRICT"
        date startDate
        date endDate "CHECK endDate > startDate"
        decimal price "price at the time of sale"
        datetime createdAt
    }
```

### User

| Column | Type | Rules |
| --- | --- | --- |
| `id` | integer | primary key, auto-increment |
| `email` | text | required, **unique** (enforced by a database index) |
| `passwordHash` | text | required; bcrypt hash (cost 10) |
| `firstName`, `lastName` | text | required, 1–50 characters |
| `role` | enum `Role` | `ADMIN`, `TRAINER` or `MEMBER`; default `MEMBER` |
| `createdAt` | timestamp | set automatically on insert |
| `updatedAt` | timestamp | updated automatically on every change |

### MembershipPlan

| Column | Type | Rules |
| --- | --- | --- |
| `id` | integer | primary key |
| `name` | text | required, unique (the API also compares ignoring letter case) |
| `durationMonths` | integer | 1–60 in the API; **database CHECK > 0** |
| `price` | decimal(10,2) | exact money type; at most 2 decimals; **database CHECK > 0** |
| `isActive` | boolean | default `true`; inactive plans cannot be sold but stay in the history |

### Membership

| Column | Type | Rules |
| --- | --- | --- |
| `id` | integer | primary key |
| `userId` | integer | foreign key → User; deleting a user deletes their memberships (`CASCADE`); indexed |
| `planId` | integer | foreign key → MembershipPlan; a plan that was sold cannot be deleted (`RESTRICT`) |
| `startDate`, `endDate` | date | calendar dates without time, both inclusive; **database CHECK endDate > startDate** |
| `price` | decimal(10,2) | copied from the plan when sold; **database CHECK > 0** |

The membership **status** (active, expiring soon, expired, upcoming, none) is **not stored**: it is calculated from the dates and "today" in the gym's time zone, so it is always correct without any scheduled job.

## Planned data model (Stages 2–3)

> This is the **planned** design. Each table is added in its own migration in the stage that needs it, and details may change during implementation. `MEMBERSHIP_PLAN` and `MEMBERSHIP` are already implemented (see above).

```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : "has"
    MEMBERSHIP_PLAN ||--o{ MEMBERSHIP : "used by"
    USER ||--o{ CHECK_IN : "makes"
    USER ||--o{ GYM_CLASS : "teaches (trainer)"
    GYM_CLASS ||--o{ BOOKING : "has"
    USER ||--o{ BOOKING : "books (member)"
    USER ||--o{ WORKOUT_PLAN : "creates (trainer)"
    USER ||--o{ WORKOUT_PLAN : "is assigned (member)"
    WORKOUT_PLAN ||--|{ WORKOUT_PLAN_EXERCISE : "contains"
    EXERCISE ||--o{ WORKOUT_PLAN_EXERCISE : "used in"
    USER ||--o{ WORKOUT_LOG : "logs (member)"
    EXERCISE ||--o{ WORKOUT_LOG : "logged for"

    USER {
        int id PK
        string email UK
        Role role
        string qrToken UK "Stage 3a"
    }
    MEMBERSHIP_PLAN {
        int id PK
        string name
        int durationMonths "> 0"
        decimal price "> 0"
    }
    MEMBERSHIP {
        int id PK
        int userId FK
        int planId FK
        date startDate
        date endDate "always after startDate"
    }
    CHECK_IN {
        int id PK
        int userId FK
        datetime checkedInAt
    }
    GYM_CLASS {
        int id PK
        string name
        int trainerId FK
        datetime startsAt
        int capacity "> 0"
    }
    BOOKING {
        int id PK
        int classId FK
        int memberId FK
        datetime createdAt
    }
    EXERCISE {
        int id PK
        string name UK
        string muscleGroup
        string description
    }
    WORKOUT_PLAN {
        int id PK
        string name
        int trainerId FK
        int memberId FK
    }
    WORKOUT_PLAN_EXERCISE {
        int id PK
        int planId FK
        int exerciseId FK
        int sets
        int reps
    }
    WORKOUT_LOG {
        int id PK
        int memberId FK
        int exerciseId FK
        decimal weight
        int reps
        datetime loggedAt
    }
```

### How the business rules map to the design

| Business rule | Where it is enforced |
| --- | --- |
| Membership end date is after its start date | Date calculation (unit-tested) + database check constraint ✅ |
| Prices and capacities are positive | Zod validation + database check constraint (prices ✅, capacities in Stage 3) |
| Memberships of one member do not overlap | Service check inside a transaction with a row lock ✅ |
| A member cannot book the same class twice | Unique index on `(classId, memberId)` + service check |
| A class cannot be booked beyond capacity | Service check inside a database transaction |
| Trainers only see members assigned to them | Through `WORKOUT_PLAN.trainerId` / `memberId` |
