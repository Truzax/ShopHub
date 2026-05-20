# Software Architecture Document (SAD)

## 0. Document Metadata
- Project: E-Commerce Analytics Dashboard
- Repository: E-Commerce-Analytics-Dashboard
- Current Branch: develop
- Default Branch: master
- Date: 2026-05-20
- Audience: Engineering teams, architects, stakeholders, onboarding developers
- Authoring Basis: Source inspection of frontend, backend, and e2e test workspaces

## Assumptions and Scope
- The product goal is to operate an e-commerce platform with analytics dashboards, order management, and AI-assisted features for both admins and customers.
- The deployed topology currently appears single-region and non-containerized.
- MongoDB is assumed as the primary operational data store.
- No dedicated message broker, external cache server, or search engine is currently integrated.
- Mobile-native clients are not in current scope; web SPA is the primary client.
- This document describes current-state architecture and production-grade target-state recommendations.

---

## 1. Executive Summary
### Purpose of the system
The system provides an integrated e-commerce experience with:
- customer-facing product discovery, cart, checkout, and order views
- admin-facing dashboard analytics and operational controls
- AI-enhanced insights (sales summary, performance recommendations, description generation, conversational assistant)

### Business goals
- Increase conversion and revenue through responsive storefront and cart/order flows.
- Improve operational decision-making via analytics and AI-generated insights.
- Reduce manual effort for content and analysis using generative AI.
- Maintain secure role-based access for admin operations.

### High-level overview
The solution is a modular web platform composed of:
- Angular SPA frontend (route guards, interceptor-based token handling)
- Express + TypeScript backend (REST APIs, role-based authorization, validation middleware)
- MongoDB persistence via Mongoose models and aggregations
- Gemini-based AI integration for summaries, recommendations, and chat

---

## 2. System Architecture Overview
### Architecture style
- Primary style: Modular Monolith
- Supporting style: Layered N-tier
- AI integration style: Synchronous external AI API invocation

### High-level architecture explanation
- A single backend deployable exposes REST APIs under /api.
- Frontend consumes APIs via HttpClient with bearer token and refresh flow.
- MongoDB stores transactional and analytical source data.
- AI requests are orchestrated by backend services and persisted/cached in MongoDB collections.

### Key design principles
- Separation of concerns: routes -> controllers -> services -> models.
- Secure-by-default middleware stack: helmet, CORS policy, rate limiting, auth guards.
- Pragmatic performance: targeted indexes, aggregation pipelines, response caching for AI outputs.
- Role-aware UX and API controls.

### Architectural decisions and tradeoffs
- Monolith vs microservices:
  - Decision: monolith for delivery speed and operational simplicity.
  - Tradeoff: simpler deployment now, but tighter coupling and scale limits later.
- MongoDB for mixed transactional + analytics workloads:
  - Decision: single datastore reduces operational overhead.
  - Tradeoff: heavy aggregation can contend with OLTP load.
- JWT access + cookie refresh token:
  - Decision: good UX with short-lived access token and rotating refresh token.
  - Tradeoff: dual-token lifecycle complexity and browser storage considerations.
- AI synchronous API calls:
  - Decision: straightforward product behavior and implementation speed.
  - Tradeoff: latency sensitivity and dependency on external provider availability.

---

## 3. Tech Stack
### Frontend
- Angular 21 + Angular Material + Chart.js
- Purpose: SPA UI, route-level RBAC UX, data visualization
- Why chosen: mature enterprise framework with robust routing/forms/tooling
- Alternatives considered: React, Vue
- Advantages: strong conventions, DI, testability, long-term maintainability

### Backend
- Node.js + Express 5 + TypeScript
- Purpose: REST API, domain orchestration, auth and security middleware
- Why chosen: fast development, broad ecosystem, TS safety
- Alternatives considered: NestJS, Fastify, Spring Boot
- Advantages: low ceremony, ecosystem breadth, straightforward integration

### Mobile
- Not applicable in current implementation
- Recommendation: API-first backend permits future mobile apps (Flutter/React Native)

### Database
- MongoDB via Mongoose
- Purpose: users/products/orders/cart + AI conversation/cache persistence
- Why chosen: flexible schema, strong JS ecosystem fit, aggregation support
- Alternatives considered: PostgreSQL, MySQL
- Advantages: rapid model evolution, native document structures, aggregation pipelines

### Caching
- Current: Application-level persistent cache in AiCache collection
- Purpose: reduce repeated AI computation and improve response times
- Alternatives considered: Redis, CDN edge caching
- Advantages: no extra infrastructure, deterministic invalidation based on data updates

### Authentication and Authorization
- JWT access token + rotating refresh token model
- Role checks via middleware and frontend guards
- Alternatives considered: session store, OAuth/OIDC provider-managed sessions
- Advantages: stateless API auth for access token path, clear role enforcement

### API communication
- REST over HTTPS
- Angular HttpClient interceptor for bearer injection and refresh retry
- Alternatives considered: GraphQL, gRPC
- Advantages: simple integration, clear resource orientation

### File storage
- Current: No dedicated file/object storage integration
- Recommendation: S3-compatible object storage for media and generated assets

### Search engine
- Current: No dedicated search engine
- Recommendation: OpenSearch/Elasticsearch or Atlas Search for scalable catalog search

### AI/ML stack
- Google Gemini via @google/genai SDK
- Purpose: sales summary, performance insights, product description generation, role-aware chat
- Alternatives considered: OpenAI, Azure OpenAI, self-hosted LLM
- Advantages: rapid feature delivery, minimal in-house ML operations

### Testing frameworks
- Backend: Jest + ts-jest + coverage
- Frontend: Angular testing stack (Karma/Jasmine)
- E2E: Playwright (Chromium, Firefox, WebKit)

### Monitoring and Logging
- Current: console logging and framework defaults
- Recommendation: structured logging, centralized observability stack, SLO-based alerting

---

## 4. Detailed Technology Breakdown

| Technology | Version | Usage | Justification | Pros | Cons |
|---|---:|---|---|---|---|
| Node.js | Assumed 20+ | Backend runtime | LTS stability with modern JS/TS | Ecosystem, performance | Single-thread CPU constraints |
| TypeScript | 5.3.3 (backend), 5.9.2 (frontend) | Type safety across stack | Reduces runtime defects | Better maintainability | Build/tooling complexity |
| Express | 5.2.1 | API layer and middleware pipeline | Minimal, flexible web framework | Fast development | Less opinionated guardrails |
| Mongoose | 9.3.3 | ODM, schema definitions, indexes | Tight Mongo integration | Productivity, validation | ODM abstraction overhead |
| MongoDB | Not pinned in repo | Primary datastore | Flexible schema + aggregation | Rapid evolution | Analytics and OLTP contention risk |
| JSON Web Token | jsonwebtoken 9.0.0 | Access token generation/verification | Standard API auth model | Stateless access validation | Revocation complexity |
| bcryptjs | 2.4.3 | Password hashing | Industry standard for password storage | Security maturity | CPU cost under load |
| express-rate-limit | 8.4.1 | Auth and global throttling | Basic abuse control | Easy integration | Limited distributed consistency |
| helmet | 8.1.0 | Security headers | OWASP-aligned defaults | Quick hardening | Needs policy tuning |
| cors | 2.8.6 | Cross-origin policy | Browser API interoperability | Necessary for SPA | Misconfig risk |
| cookie-parser | 1.4.6 | Refresh token cookie handling | Required for cookie-based refresh | Simple | Cookie policy maintenance |
| compression | 1.8.1 | Response compression | Better payload efficiency | Faster perceived performance | CPU tradeoff |
| nodemailer | 8.0.5 | Password reset email sending | Common SMTP integration | Portable | Deliverability ops burden |
| @google/genai | 2.0.0 | Gemini AI integration | Fast AI feature enablement | Minimal custom ML infra | Vendor dependency, latency |
| Angular | 21.2.11 | SPA framework | Enterprise-ready structure | DI/routing/testing | Learning curve |
| Angular Material/CDK | 21.2.x | UI primitives | Accelerated consistent UI | Accessibility baseline | Theming constraints |
| Chart.js | 4.5.1 | Dashboard visualizations | Lightweight charting | Flexible charts | Client rendering overhead |
| RxJS | 7.8.x | Reactive streams in frontend | Native Angular fit | Powerful async model | Complexity for teams |
| Tailwind CSS | 4.1.12 | Styling utility framework | Fast custom UI iteration | Productivity | Utility sprawl risk |
| Jest | 29.7.0 | Backend unit/integration tests | Strong TS ecosystem support | Fast local feedback | Requires mocking discipline |
| Playwright | 1.60.0 | Cross-browser e2e tests | High-fidelity browser automation | Deterministic tooling | Infra/setup maintenance |

---

## 5. Frontend Architecture
### Component structure
- Standalone Angular components with lazy-loaded route targets.
- Key domains: auth, dashboard, analytics, product list/form, cart, checkout, orders, profile, AI chat.
- Shared shell in LayoutComponent with role-aware navigation.

### State management
- Lightweight service-based state using BehaviorSubject and RxJS streams.
- AuthService holds current user and access token handling.
- CartService maintains local cart state and server synchronization after login.
- No global store library (NgRx) currently used.

### Routing
- Centralized route table with guarded areas:
  - AuthGuard for authenticated app shell
  - AdminGuard for admin-only features
- Lazy loading per feature route to reduce initial bundle cost.

### UI framework
- Angular Material for controls/menu/toolbar/icons.
- Tailwind utility classes and CSS variables for custom theming.
- Chart.js for analytics visualizations.

### Data fetching strategy
- Service-per-domain pattern using Angular HttpClient.
- Auth interceptor injects bearer token and attempts refresh on 401 (non-auth routes).
- Dashboard data pipeline uses debounced filter stream and shared replay.

### Performance optimizations
- Lazy route-level loading.
- OnPush change detection in dashboard component.
- Debounced filter updates for analytics requests.
- shareReplay for analytics response reuse.

### Security considerations
- Route guards enforce UI-level access constraints.
- Access token in local storage (current implementation risk).
- Refresh token uses httpOnly cookie from backend.
- Interceptor avoids refresh recursion for auth endpoints.

---

## 6. Backend Architecture
### Service structure
- Route modules by bounded domain: auth, users, products, orders, cart, dashboard analytics, AI.
- Controllers handle HTTP concerns.
- Services encapsulate business logic and persistence orchestration.
- Models define schema, constraints, and indexes.

### API design
- RESTful routes under /api/*.
- Resource-oriented endpoints with pagination for list operations.
- Admin-only operational endpoints protected by role middleware.

### Authentication flow
- Signup/login issues:
  - short-lived JWT access token in response body
  - refresh token in httpOnly cookie
- Refresh endpoint rotates refresh token and returns new access token.
- Logout revokes refresh token hash and clears cookie.

### Database access pattern
- Mongoose CRUD for transactional operations.
- Aggregation pipelines for dashboard analytics.
- Populate used for relational projections (user/order/product associations).

### Error handling
- Centralized global error handler standardizes response shape.
- catchAsync wrapper funnels async errors to middleware.
- Production mode suppresses internal stack details for 500 responses.

### Validation strategy
- Middleware validation for product/order payload structures.
- Service-level domain validation (status transitions, stock constraints, authorization checks).
- Model-level schema constraints in Mongoose.

### Scalability considerations
- Stateless access token verification supports horizontal API scaling.
- Current refresh token and cache persistence in DB supports multi-instance consistency.
- Aggregation-heavy endpoints need read scaling strategy and potentially pre-aggregation.

### Security architecture
- helmet headers, CORS origin control, compression, global/auth rate limits.
- Role-based authorization middleware.
- Password hashing with bcrypt; refresh/reset token hashing with SHA-256.

---

## 7. Database Design
### Database type and reasoning
- MongoDB document model is used for fast iteration and nested structures (order items, AI messages).

### Schema design approach
- Hybrid referencing + denormalized snapshots:
  - Orders reference product and user IDs
  - Orders also snapshot item name/category/price for historical integrity

### Relationships
- User 1..N Order
- User 1..1 Cart
- Order 1..N OrderItem -> Product reference
- User 1..N AiConversation
- AiCache keyed by computed cache key

### Indexing strategy
- Product: category index for filtering
- Order: date/status, products.product, status indexes for analytics/status queries
- AiConversation: userId/sessionId indexes
- AiCache: unique key index

### Data consistency approach
- Eventual consistency acceptable for analytics views.
- Transactional sensitivity in stock deduction logic handled in service layer during status transitions.
- Recommendation: use Mongo transactions for multi-document stock/order updates under high concurrency.

---

## 8. API Architecture
### REST explanation
- HTTP JSON REST APIs are used for broad compatibility and ease of frontend integration.

### Endpoint organization
- /api/auth: signup/login/refresh/logout/password reset
- /api/users: profile and admin user listing
- /api/products: catalog and admin product management
- /api/orders: order lifecycle and admin status changes
- /api/cart: authenticated cart management
- /api/dashboard: admin analytics aggregates
- /api/ai: AI summary/insights/description/chat

### Versioning strategy
- Current: unversioned base path.
- Recommendation: introduce /api/v1 for forward compatibility.

### Authentication
- Bearer JWT for protected APIs.
- Refresh via cookie-based endpoint.
- Role checks for admin-only APIs.

### API documentation strategy
- Current: implicit via routes/tests.
- Recommendation: OpenAPI 3.1 spec with generated docs and contract tests.

---

## 9. Security Architecture
### Authentication
- Access token (JWT) signed with server secret, short TTL.
- Refresh token random secret, server-side hashed, rotated on refresh.

### Authorization
- API middleware verifies authentication and user role.
- Frontend route guards provide UX-level constraints (not security boundary alone).

### Encryption
- In transit: TLS required in production.
- At rest: rely on MongoDB encryption and infrastructure policy.
- Sensitive token artifacts stored hashed where applicable.

### Secrets management
- Current: dotenv environment variables.
- Recommendation: managed secret store (Vault/AWS Secrets Manager/Azure Key Vault), rotation policy.

### OWASP protections
- Implemented:
  - Security headers (helmet)
  - Rate limiting on auth/global routes
  - Password hashing
  - Controlled error responses in production
- Gaps and recommendations:
  - Add strict input schema validation (zod/joi) consistently
  - Add CSRF strategy if cookie auth surface expands
  - Add audit logs for admin-sensitive actions
  - Add dependency scanning and SAST/DAST gates

### Compliance considerations
- If handling PII/payment context, align with:
  - GDPR/CCPA data rights and retention
  - PCI DSS boundary isolation (if payment details are introduced)
  - SOC 2 controls for logging, change management, and access governance

---

## 10. Monitoring and Observability
### Logging strategy
- Current: console logs in app and service paths.
- Target:
  - Structured JSON logs with correlation IDs
  - request/response metadata and latency fields
  - centralized ingestion (ELK/OpenSearch/Datadog)

### Metrics
- Key metrics:
  - API latency p50/p95/p99 by endpoint
  - error rate by endpoint and status class
  - auth refresh success/failure rates
  - AI request latency, token usage, cache hit ratio
  - Mongo query/aggregation duration and saturation

### Error tracking
- Integrate Sentry/New Relic with release markers and source maps.

### Alerting approach
- SLO-based alerts:
  - 5xx error rate threshold
  - p95 latency threshold per critical endpoint
  - auth failure anomalies
  - AI provider outage/timeout spikes

---

## 11. Performance and Scalability
### Caching strategy
- Current: AI result persistence cache keyed by query/time window/category.
- Next:
  - Redis for hot response caching and token/session adjuncts
  - cache invalidation by data update events

### Database optimization
- Existing indexes for analytics and category filters.
- Additions:
  - compound indexes based on observed query plans
  - optional read replicas for analytics-heavy operations
  - pre-aggregated daily metrics collection for dashboard

### Horizontal scaling approach
- Scale API instances behind load balancer.
- Keep services stateless where possible.
- Ensure shared refresh token and cache state in centralized data store.

### Performance optimizations
- Frontend: route lazy loading, OnPush, debounced filters.
- Backend: aggregation faceting and bounded query windows.
- Recommendation: asynchronous AI job mode for long-running requests.

---

## 12. Reliability and Availability
### Error recovery strategy
- Global error middleware ensures controlled failure responses.
- Refresh-token fallback and forced logout path preserve auth integrity.
- Recommendation: retry policies with circuit breakers around AI provider calls.

### Redundancy considerations
- Current redundancy not explicit in repo.
- Target:
  - multi-AZ deployment for API and DB
  - Mongo replica set
  - backup and restore drills

### Data reliability approach
- Snapshotting order line item details protects historical reporting from product changes.
- Recommendation: transactional safeguards for stock updates and order status transitions.

---

## 13. Risks and Technical Challenges
| Risk Area | Observation | Impact | Mitigation |
|---|---|---|---|
| Token storage | Access token in localStorage | XSS token theft risk | Move access token to memory + silent refresh, enforce strict CSP |
| Aggregation load | Real-time analytics over orders | DB contention under scale | Pre-aggregation, read replicas, scheduled materialization |
| AI dependency | Synchronous external AI calls | Latency and failure propagation | Timeout, fallback messages, circuit breaker, async queue |
| Validation consistency | Mixed validation layers | Input-quality gaps | Standardize schema validation middleware across all endpoints |
| Concurrency | Stock update is multi-step service logic | Oversell risk under contention | Mongo transactions, optimistic locking/versioning |
| Observability gap | Console logging only | Slow incident diagnosis | Structured logs + tracing + actionable alerts |

---

## 14. Future Improvements
### Suggested enhancements
- Introduce OpenAPI-first API contracts and client generation.
- Add centralized validation schemas and reusable error catalog.
- Implement robust RBAC policy definitions and audit trails.

### Scaling roadmap
1. Add observability stack and SLO dashboard.
2. Introduce Redis and dashboard pre-aggregation jobs.
3. Split AI-heavy and analytics-heavy workloads into dedicated services when warranted.
4. Add queue-based asynchronous processing for AI and heavy reporting.

### Refactoring opportunities
- Normalize service naming and remove dead/legacy service endpoints.
- Consolidate duplicated auth initialization patterns.
- Introduce repository layer for testability at scale.

### Emerging technologies to consider
- Vector search + retrieval augmentation for richer AI assistant grounding.
- Feature flags for controlled rollout of analytics/AI capabilities.
- Policy-as-code for authorization and compliance checks.

---

## 15. Architecture Decision Records (ADR)
### ADR-001: Modular Monolith over Microservices
- Context: Team needs rapid delivery with manageable operational overhead.
- Decision: Keep backend as modular monolith with domain route/service boundaries.
- Consequences: Faster iteration now; future extraction path required for independent scaling.

### ADR-002: MongoDB as Primary Store
- Context: Need flexibility for varied entities and nested order/AI structures.
- Decision: Use MongoDB + Mongoose.
- Consequences: Quick evolution; requires careful index and aggregation strategy at scale.

### ADR-003: JWT Access + Rotating Refresh Token
- Context: Need secure sessions with SPA-friendly UX.
- Decision: Access token in API auth header, refresh token in httpOnly cookie.
- Consequences: Good UX and revocation support; token lifecycle complexity increases.

### ADR-004: AI Integration via External Provider (Gemini)
- Context: Business needs AI capabilities without building in-house ML platform.
- Decision: Use Gemini SDK from backend services.
- Consequences: Fast feature delivery; introduces vendor and latency dependency.

### ADR-005: Role-Based Authorization in Middleware
- Context: Admin actions must be isolated from customer actions.
- Decision: Enforce role checks in API middleware and route guards in UI.
- Consequences: Clear policy enforcement; requires rigorous coverage tests.

---

## 16. Diagrams
### 16.1 High-Level Architecture Diagram
~~~mermaid
flowchart LR
  U[End Users and Admins] --> F[Angular SPA Frontend]
  F -->|HTTPS REST /api| B[Express TypeScript Backend]
  B --> M[(MongoDB)]
  B --> G[Google Gemini API]
  B --> S[SMTP Provider]

  subgraph Backend Domains
    B1[Auth and Users]
    B2[Products and Cart]
    B3[Orders and Dashboard]
    B4[AI Services]
  end

  B --> B1
  B --> B2
  B --> B3
  B --> B4
~~~

### 16.2 Component Diagram
~~~mermaid
flowchart TB
  subgraph Frontend
    R[Angular Router]
    G1[AuthGuard/AdminGuard]
    I[Auth Interceptor]
    C1[Dashboard Components]
    C2[Product and Cart Components]
    C3[Auth Components]
    FS[Frontend Services]
  end

  subgraph Backend
    RT[Routes]
    CT[Controllers]
    SV[Services]
    MD[Models]
    MW[Middleware]
  end

  R --> G1 --> C1
  R --> G1 --> C2
  R --> C3
  C1 --> FS
  C2 --> FS
  C3 --> FS
  FS --> I
  I --> RT
  RT --> MW --> CT --> SV --> MD
~~~

### 16.3 Database Relationship Diagram
~~~mermaid
erDiagram
  USER ||--o{ ORDER : places
  USER ||--|| CART : owns
  USER ||--o{ AI_CONVERSATION : has
  ORDER ||--|{ ORDER_ITEM : contains
  PRODUCT ||--o{ ORDER_ITEM : referenced_by
  CART ||--|{ CART_ITEM : contains
  PRODUCT ||--o{ CART_ITEM : referenced_by
  AI_CACHE {
    string key
    mixed data
    date lastDataUpdate
  }

  USER {
    objectId _id
    string email
    string password
    string role
    array refreshTokens
  }

  PRODUCT {
    objectId _id
    string name
    number price
    string category
    number stock
  }

  ORDER {
    objectId _id
    string orderNumber
    objectId user
    number total
    string status
    date date
    bool stockUpdated
  }
~~~

### 16.4 Sequence Diagram: Login and Token Refresh
~~~mermaid
sequenceDiagram
  participant U as User
  participant FE as Angular Frontend
  participant BE as Auth API
  participant DB as MongoDB

  U->>FE: Submit credentials
  FE->>BE: POST /api/auth/login
  BE->>DB: Validate user and password
  DB-->>BE: User found
  BE-->>FE: access token + refresh cookie
  FE->>FE: Store access token

  FE->>BE: Protected API with bearer token
  BE-->>FE: 401 Unauthorized (expired token)
  FE->>BE: POST /api/auth/refresh (cookie)
  BE->>DB: Validate and rotate refresh token
  BE-->>FE: New access token + rotated refresh cookie
  FE->>BE: Retry original request
  BE-->>FE: 200 OK
~~~

### 16.5 Sequence Diagram: Order Status and Stock Deduction
~~~mermaid
sequenceDiagram
  participant A as Admin
  participant FE as Frontend
  participant BE as Orders API
  participant DB as MongoDB

  A->>FE: Update order status to processing/shipped/delivered
  FE->>BE: PUT /api/orders/:id/status
  BE->>DB: Load order and products
  BE->>BE: Validate transition and stockUpdated flag
  BE->>DB: Deduct stock per item
  BE->>DB: Persist new order status and stockUpdated=true
  DB-->>BE: Updated order
  BE-->>FE: 200 Updated order
~~~

### 16.6 Sequence Diagram: AI Sales Summary with Cache
~~~mermaid
sequenceDiagram
  participant Admin
  participant FE as Frontend
  participant BE as AI Controller
  participant DB as MongoDB
  participant LLM as Gemini

  Admin->>FE: Request AI sales summary
  FE->>BE: GET /api/ai/sales-summary
  BE->>DB: Check AiCache by cache key
  alt Cache valid
    DB-->>BE: Cached summary
    BE-->>FE: Return cached result
  else Cache miss/stale
    BE->>DB: Query orders dataset
    BE->>LLM: Generate structured summary
    LLM-->>BE: JSON summary
    BE->>DB: Upsert cache with lastDataUpdate
    BE-->>FE: Return generated summary
  end
~~~

---

## 17. Best Practices Followed
### Coding standards
- TypeScript across backend and frontend for stronger contracts.
- Layered separation and modular route organization.
- Async error funneling with reusable wrapper middleware.

### Security practices
- Password hashing and token hashing.
- Security headers and rate limiting.
- Role-based authorization on sensitive endpoints.

### Scalability practices
- Paginated APIs for list responses.
- Indexed fields aligned to query/aggregation patterns.
- Frontend lazy loading and selective data refresh behavior.

### Reliability practices
- Centralized error handling response model.
- Token refresh flow resilience and forced logout fallback.
- Cross-browser e2e coverage via Playwright projects.

---

## 18. Conclusion
### Summary
The platform is a solid modular-monolith implementation for an e-commerce analytics product with meaningful AI augmentation and clear domain separation. Current architecture is suitable for early-to-mid scale workloads and team velocity.

### Recommendations
- Prioritize security hardening around token handling and schema validation standardization.
- Invest in observability and performance baselines before traffic scale-up.
- Introduce API versioning and contract-driven documentation.
- Plan staged decomposition of analytics/AI workloads when resource contention becomes measurable.

### Final architectural assessment
- Current-state maturity: Good for growth-stage delivery.
- Production readiness: Moderate, with clear improvement opportunities in observability, security posture, and scale controls.
- Strategic fit: Strong foundation with incremental path to enterprise-grade reliability and scale.

---

## Appendix: Evidence Anchors (Code Locations)
- Backend entry and middleware stack: e-commerce-backend/server.ts
- Auth controller/service and token flow: e-commerce-backend/controllers/authController.ts, e-commerce-backend/services/authService.ts
- Analytics and AI orchestration: e-commerce-backend/controllers/analyticsController.ts, e-commerce-backend/services/analyticsService.ts, e-commerce-backend/controllers/aiController.ts, e-commerce-backend/services/aiService.ts
- Data model and indexes: e-commerce-backend/models/User.ts, e-commerce-backend/models/Product.ts, e-commerce-backend/models/Order.ts, e-commerce-backend/models/Cart.ts, e-commerce-backend/models/AiConversation.ts, e-commerce-backend/models/AiCache.ts
- Frontend routing/guards/interceptor: e-commerce-frontend/src/app/app.routes.ts, e-commerce-frontend/src/app/services/auth.guard.ts, e-commerce-frontend/src/app/services/admin.guard.ts, e-commerce-frontend/src/app/interceptors/auth.interceptor.ts
- Frontend service/data flow: e-commerce-frontend/src/app/services/auth.ts, e-commerce-frontend/src/app/services/dashboard.service.ts, e-commerce-frontend/src/app/services/cart.service.ts, e-commerce-frontend/src/app/services/ai.service.ts
- Test infrastructure: e-commerce-backend/jest.config.cjs, e2e-tests/playwright.config.ts
