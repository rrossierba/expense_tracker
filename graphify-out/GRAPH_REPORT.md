# Graph Report - expense_tracker  (2026-10-25)

## Corpus Check
- Corpus is ~15,004 words - fits in a single context window. You may not need a graph.

## Summary
- 572 nodes · 1499 edges · 22 communities (14 shown, 8 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 136 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend Application UI
- API Errors and Exceptions
- Authentication and Security
- Budgets and Savings Goals
- Transactions and Recurrence
- Containers and Deployment
- Database Migrations
- Accounts API
- Frontend Domain Types
- Frontend Tooling Dependencies
- Analytics API
- TypeScript Configuration
- Backend Configuration
- Next.js Project Documentation
- File Icon Asset
- Globe Icon Asset
- Next.js Logo Asset
- Vercel Logo Asset
- Browser Window Asset
- Backend Service Metadata

## God Nodes (most connected - your core abstractions)
1. `NotFoundException` - 21 edges
2. `Account` - 17 edges
3. `SavingsGoalResponse` - 17 edges
4. `Category` - 17 edges
5. `TransactionType` - 17 edges
6. `Base` - 16 edges
7. `Transaction` - 16 edges
8. `compilerOptions` - 16 edges
9. `User` - 15 edges
10. `SavingsGoalService` - 15 edges

## Surprising Connections (you probably didn't know these)
- `SavingsGoalService` --uses--> `BadRequestException`  [INFERRED]
  backend/src/modules/budgets/service.py → backend/src/core/exceptions.py
- `TransactionService` --uses--> `BadRequestException`  [INFERRED]
  backend/src/modules/transactions/service.py → backend/src/core/exceptions.py
- `AuthService` --uses--> `ForbiddenException`  [INFERRED]
  backend/src/modules/auth/service.py → backend/src/core/exceptions.py
- `AccountService` --uses--> `NotFoundException`  [INFERRED]
  backend/src/modules/accounts/service.py → backend/src/core/exceptions.py
- `BudgetService` --uses--> `NotFoundException`  [INFERRED]
  backend/src/modules/budgets/service.py → backend/src/core/exceptions.py

## Import Cycles
- None detected.

## Communities (22 total, 8 thin omitted)

### Community 0 - "Frontend Application UI"
Cohesion: 0.06
Nodes (54): LoginPage(), RegisterPage(), DashboardLayout(), DashboardPage(), geistMono, geistSans, metadata, RootLayout() (+46 more)

### Community 1 - "API Errors and Exceptions"
Cohesion: 0.10
Nodes (27): AppException, BadRequestException, ForbiddenException, NotFoundException, Category, CategoryType, Tag, create_category() (+19 more)

### Community 2 - "Authentication and Security"
Cohesion: 0.08
Nodes (23): get_current_user(), ConflictException, UnauthorizedException, create_access_token(), create_jwt_token(), create_refresh_token(), decode_token(), get_password_hash() (+15 more)

### Community 3 - "Budgets and Savings Goals"
Cohesion: 0.13
Nodes (28): BudgetPeriod, SavingsGoal, create_budget(), create_savings_goal(), delete_budget(), delete_savings_goal(), deposit_to_goal(), get_savings_goal() (+20 more)

### Community 4 - "Transactions and Recurrence"
Cohesion: 0.12
Nodes (24): RecurrenceFrequency, RecurringTransaction, Transaction, TransactionType, create_recurring_transaction(), create_transaction(), delete_recurring_transaction(), delete_transaction() (+16 more)

### Community 5 - "Containers and Deployment"
Cohesion: 0.05
Nodes (39): build, command, container_name, depends_on, environment, ports, restart, volumes (+31 more)

### Community 6 - "Database Migrations"
Cohesion: 0.14
Nodes (9): do_run_migrations(), run_async_migrations(), run_migrations_offline(), run_migrations_online(), upgrade(), Base, get_db(), TimestampMixin (+1 more)

### Community 7 - "Accounts API"
Cohesion: 0.13
Nodes (12): Account, AccountType, create_account(), delete_account(), get_account(), list_accounts(), update_account(), AccountBase (+4 more)

### Community 8 - "Frontend Domain Types"
Cohesion: 0.07
Nodes (27): Account, AccountCreatePayload, AccountType, AccountUpdatePayload, Budget, BudgetCreatePayload, BudgetPeriod, BudgetUpdatePayload (+19 more)

### Community 9 - "Frontend Tooling Dependencies"
Cohesion: 0.09
Nodes (28): eslintConfig, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.0, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20 (+20 more)

### Community 10 - "Analytics API"
Cohesion: 0.22
Nodes (11): get_category_breakdown(), get_dashboard_summary(), get_monthly_trend(), AccountBalance, CategoryBreakdown, CategoryBreakdownResponse, DashboardSummaryResponse, MonthlyTrend (+3 more)

### Community 11 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "Backend Configuration"
Cohesion: 0.12
Nodes (3): get_settings(), Settings, health_check()

### Community 13 - "Next.js Project Documentation"
Cohesion: 0.14
Nodes (14): Bundled Next.js Documentation, Next Dev Agent File Generation, Next.js Agent Rules, Application Page, create-next-app, Development Server, Geist Font, Learn Next.js (+6 more)

## Knowledge Gaps
- **13 isolated node(s):** `backend`, `Next Dev Agent File Generation`, `create-next-app`, `Application Page`, `Geist Font` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 167 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NotFoundException` connect `API Errors and Exceptions` to `Budgets and Savings Goals`, `Transactions and Recurrence`, `Accounts API`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `NotFoundException` (e.g. with `AccountService` and `BudgetService`) actually correct?**
  _`NotFoundException` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `Next Dev Agent File Generation`, `create-next-app` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Application UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05669710806697108 - nodes in this community are weakly interconnected._
- **Why does `TransactionType` connect `Transactions and Recurrence` to `Analytics API`, `Budgets and Savings Goals`, `Database Migrations`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Account` (e.g. with `AccountService` and `AnalyticsService`) actually correct?**
  _`Account` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `API Errors and Exceptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09933435739887353 - nodes in this community are weakly interconnected._