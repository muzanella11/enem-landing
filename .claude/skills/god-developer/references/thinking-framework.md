# Thinking Framework - Detailed Guide

Six mandatory steps to execute before every engineering response. Never skip steps.

---

## Step 1: Understand the Problem

Before touching code or proposing solutions, gather full context.

**Analyze:**
- **Business objectives** - What outcome does the business need? What metric moves?
- **User goals** - Who is the end user? What job are they trying to accomplish?
- **Technical constraints** - Legacy systems, existing stack, team skills, deadlines
- **Existing architecture** - What is already in place? What would this change affect?
- **Team capabilities** - What can the team realistically maintain long-term?
- **Operational requirements** - Deployment model, SLA expectations, on-call burden
- **Growth expectations** - Expected load, user count, data volume in 1 / 3 / 5 years

**Red flags that demand deeper understanding:**
- Vague success criteria ("make it faster", "more scalable")
- No mention of existing system boundaries
- Implicit assumptions about scale
- Missing non-functional requirements (latency, availability, consistency)

---

## Step 2: Challenge Assumptions

Every proposal rests on assumptions. Surface them before building on them.

**Identify and question:**
- Ambiguous requirements - "High availability" means 99.9% or 99.999%?
- Missing information - What happens when the third-party service is down?
- Invalid assumptions - "Users will always have a stable connection"
- Hidden complexity - Timezone handling, currency precision, distributed consistency
- Technical debt risks - Will this create a maintenance burden in 6 months?
- Future maintenance risks - Who will own this when the original author leaves?

**Useful challenge questions:**
- "What happens when X fails?"
- "What is the expected volume in 2 years?"
- "Who is responsible for operating this?"
- "What is the acceptable recovery time if this goes down?"
- "Is this consistent with the existing architecture patterns?"

---

## Step 3: Failure-Oriented Analysis

Design for failure. Systems that cannot handle failure are not production-ready.

**Evaluate every proposed solution against:**

| Failure Type | Questions to Ask |
|---|---|
| Service outages | What happens when this service is unavailable? |
| Database failures | What if the primary DB goes down? Is there a replica? |
| Network interruptions | Are requests idempotent? Are retries safe? |
| Dependency failures | What if the external API times out or rate-limits? |
| Data corruption | Can bad data propagate silently? |
| Deployment failures | Can a bad deploy be rolled back without data loss? |
| Human errors | What prevents accidental data deletion? |
| Traffic spikes | What happens at 10x normal load? Does it degrade gracefully? |
| Security breaches | What is the blast radius if credentials are compromised? |

**Mitigation patterns to consider:**
- Circuit breakers for external dependencies
- Idempotency keys for state-changing operations
- Dead letter queues for async failures
- Read replicas for database read scaling
- Feature flags for gradual rollouts
- Blue/green or canary deployments
- Backups with tested restore procedures

---

## Step 4: Security Review Checklist

Perform on every response. No exceptions.

### Authentication
- [ ] Are endpoints properly protected?
- [ ] Are JWT tokens validated correctly (expiry, signature, issuer)?
- [ ] Is brute-force protection in place (rate limiting, account lockout)?
- [ ] Are password hashing algorithms appropriate (bcrypt, argon2)?

### Authorization
- [ ] Is authorization checked at the service layer, not just the API layer?
- [ ] Is vertical privilege escalation possible (user accessing admin resources)?
- [ ] Is horizontal privilege escalation possible (user A accessing user B's data)?
- [ ] Are service-to-service calls authenticated?

### Input Validation
- [ ] Is all user input validated and sanitized?
- [ ] Are SQL queries parameterized (never string-concatenated)?
- [ ] Is output escaped to prevent XSS?
- [ ] Are file uploads restricted by type and size?
- [ ] Is SSRF possible from URL inputs?

### Data Exposure
- [ ] Are sensitive fields excluded from API responses?
- [ ] Are secrets in environment variables, never in code?
- [ ] Is PII handled according to compliance requirements?
- [ ] Are database credentials rotatable without code changes?

### Transport
- [ ] Is all traffic over TLS?
- [ ] Are security headers set (HSTS, CSP, X-Frame-Options)?
- [ ] Is CORS configured correctly (not wildcard in production)?

### Audit Logging
- [ ] Are authentication events logged?
- [ ] Are authorization failures logged?
- [ ] Are sensitive data accesses logged?
- [ ] Are logs tamper-evident and stored separately?

---

## Step 5: Scalability Analysis Framework

Evaluate growth across four dimensions.

### Traffic Scaling
| User Scale | Concerns |
|---|---|
| 10 users | Correctness, basic functionality |
| 1,000 users | Connection pooling, basic caching |
| 100,000 users | Database read replicas, CDN, horizontal scaling |
| 1,000,000+ users | Sharding, eventual consistency, async processing, regional distribution |

### Database Scaling Patterns
- **Read-heavy**: Add read replicas, add caching layer (Redis)
- **Write-heavy**: Connection pooling, write sharding, eventual consistency
- **Mixed**: CQRS (separate read/write models), event sourcing
- **Time-series data**: Partitioning, TTL policies, dedicated TSDB

### Caching Strategy
- **L1 (in-process)**: Local memory cache, fastest, invalidation is hard
- **L2 (distributed)**: Redis/Memcached, consistent across instances
- **CDN**: Static assets, public API responses
- **Cache invalidation**: TTL vs event-driven invalidation — choose based on consistency requirements

### Async vs Sync
- Long-running operations belong in async queues, not HTTP responses
- Use message queues (RabbitMQ, SQS, Kafka) for work that can be decoupled
- Design idempotent consumers to handle duplicate messages

---

## Step 6: Maintainability Review

Code is read 10x more than it is written. Optimize for the reader.

**Evaluate:**
- **Readability** - Can a new engineer understand this in under 5 minutes?
- **Testability** - Can this be unit tested without complex mocking?
- **Modularity** - Is this easy to replace or refactor independently?
- **Separation of concerns** - Does each module have one clear responsibility?
- **Documentation debt** - Will future maintainers understand the "why", not just the "what"?
- **Onboarding complexity** - How long until a new team member can contribute here?

**Red flags:**
- Functions longer than 30 lines
- More than 3 levels of nesting
- Boolean parameters ("doThis(true, false, true)")
- Magic numbers without named constants
- Business logic buried in database queries
- No tests for critical paths
