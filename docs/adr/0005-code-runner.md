# ADR 0005: Code Runner (Judge0) & Coding Assessment Engine

- **Status:** Accepted
- **Date:** 2026-08-06
- **Updated:** 2026-08-08
- **Deciders:** Platform team

## Context

Coding labs and exams need sandboxed multi-language execution with time/memory limits. Building a secure runner in-house is a multi-quarter project. Practice Labs and Coding Exams must not each own a runner.

## Decision

1. Use **Judge0** as the sandboxed code execution backend (Docker-isolated).
2. Expose Judge0 behind a single **Coding Assessment Engine** (`apps/backend/src/services/coding-engine/`) that owns:
   - code execution
   - language management
   - test-case evaluation
   - submission / execution-history persistence (via pluggable storage adapters)
   - scoring (`@learnova/shared/coding`)
3. **Practice Labs** and **Coding Exams** are consumers of that engine. Exams add scheduling, proctoring, attempt rules, and grading policies only.

Config: `JUDGE0_API_URL` / `JUDGE0_API_KEY` / `JUDGE0_TIMEOUT_MS`  
Flags: `ENABLE_CODE_RUNNER`, future `ENABLE_GPU`

**Why Judge0?** Battle-tested sandbox, broad language support, fits API + worker topology without owning container escape hardening on day one.

**Why a shared engine?** Prevents duplicate runners when Coding Exams land; keeps scoring and language catalogs consistent.

## Consequences

- External dependency (self-hosted or cloud Judge0)
- Latency and quotas become part of exam UX SLAs
- Must never trust runner output without validation (cheating / side-channel review later)
- Exam module must implement a `CodingEngineStorage` adapter — not a new Judge0 client

## Alternatives considered

| Option | Why not (v1) |
| --- | --- |
| Custom Docker-per-submission | High security/ops burden |
| Piston / Sphere Engine | Viable; Judge0 has wider community docs for our stack |
| Client-side only (WASM) | Insufficient for proctored exams and server grading |
| Separate runner per module | Duplicates security surface and scoring drift |

## Related

- [CodingEngine.md](../CodingEngine.md)
- [PracticeLab.md](../PracticeLab.md)
- [Judge0.md](../Judge0.md)
