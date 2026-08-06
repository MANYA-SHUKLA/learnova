# ADR 0005: Code Runner (Judge0)

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** Platform team

## Context

Coding labs and exams need sandboxed multi-language execution with time/memory limits. Building a secure runner in-house is a multi-quarter project.

## Decision

Use **Judge0** as the code execution engine:

- Optional in local Docker Compose (commented until needed)
- Config via `JUDGE0_API_URL` / `JUDGE0_API_KEY`
- Feature flags: `ENABLE_CODE_RUNNER`, future `ENABLE_GPU` for specialized workloads
- Backend submits jobs; worker may poll/process results asynchronously

**Why Judge0?** Battle-tested sandbox, broad language support, and fits our “API + worker” topology without owning container escape hardening on day one.

## Consequences

- External dependency (self-hosted or cloud Judge0)
- Latency and quotas become part of exam UX SLAs
- Must never trust runner output without validation (cheating / side-channel review later)

## Alternatives considered

| Option | Why not (v1) |
| --- | --- |
| Custom Docker-per-submission | High security/ops burden |
| Piston / Sphere Engine | Viable; Judge0 has wider community docs for our stack |
| Client-side only (WASM) | Insufficient for proctored exams and server grading |
