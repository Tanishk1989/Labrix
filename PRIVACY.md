# TRACE AI Privacy, Data Transmission & Governance Policy

## 1. Overview & Core Privacy Principles

TRACE is built on the principle of **"Trace the work, not the screen."** We treat student code, academic evaluation, and student telemetry with the highest standard of institutional data privacy.

- **Zero Automatic Transmission**: Student source code and telemetry are **never automatically sent** to third-party AI models on page load or background events.
- **Deterministic First**: All initial code analysis, AST metrics, complexity estimations, and viva prompts run locally within the application container via deterministic static analysis.
- **Explicit Teacher Authorization**: External LLM queries (Groq / Gemini) are executed **only** upon explicit teacher action (e.g. clicking "Generate AI Viva Suggestions").
- **Institutional & Classroom Toggles**: Administrators and teachers can disable AI assistance globally or on a per-classroom basis (`aiAssistanceEnabled = false`).
- **No Training on Student Data**: Third-party API integrations (Groq, Google Gemini) use enterprise API tiers configured with zero data retention and zero training opt-outs.

---

## 2. Data Transmission Matrix

| Feature | Provider / Destination | Data Transmitted | Data Excluded / Redacted | Retention Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Deterministic Viva Generator** | Local Node.js Process | None (local execution) | N/A | Local memory only |
| **Integrity & AST Engine** | Local Node.js Process | None (local execution) | N/A | Local DB snapshots |
| **Explicit AI Viva Defense** | Groq / Google Gemini | Student submitted code, Task instructions, Pass ratio, Execution runtime | Student identity, Email, Clerk IDs, Institution name | Zero retention (API terms: no training, ephemeral processing) |
| **Student Code Execution** | Local Docker Sandbox (`trace-runner-java`, `trace-runner-cpp`) | Code snippet & test case inputs | Student identity, network access (sandbox is offline) | Temporary container ephemeral directory |

---

## 3. Caching, Budgeting & Provider Resilience

1. **Cryptographic Source Code Caching**:
   - Every AI request is indexed by `SHA256(sourceCode + language + taskTitle)`.
   - Identical submissions reuse cached results for 1 hour, reducing external API calls by up to 90%.
2. **Rate Limiting & Cost Controls**:
   - Teachers are rate-limited to **5 AI generation requests per minute**.
   - Hourly and daily budgets prevent unbounded token usage.
3. **Provider Timeouts & Fallback**:
   - External LLM requests have a strict **8-second timeout** with `AbortController`.
   - If the provider fails, times out, or returns a 5xx error, TRACE automatically returns the deterministic AST analysis with zero downtime.
4. **Audit Logging**:
   - Every AI generation request is permanently recorded in `AiGenerationAuditLog` with timestamp, teacher ID, prompt token estimate, source code hash, and latency.
