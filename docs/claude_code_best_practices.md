# Claude Code Best Practices – Referenzhandbuch & Wissensspeicher

*Quelle & Referenz: [`shanraisshan/claude-code-best-practice`](https://github.com/shanraisshan/claude-code-best-practice) (basierend auf den öffentlich geteilten Arbeitsweisen von Boris Cherny, Head of Claude Code bei Anthropic).*

Dieses Dokument dient als dauerhafter Wissensspeicher für zukünftige Entwicklungs-Sessions und neue Features.

---

## 1. Die Kern-Philosophie von Boris Cherny

1. **Test-Harness & Self-Verification über alles:**
   * Ein Agent darf den Entwickler niemals fragen, ob etwas funktioniert, wenn er es selbst durch automatisierte Tests verifizieren kann.
   * Das Projekt muss über deterministische Skripte verfügen (z. B. `npm run build`, `npm run test:all`, `npm run test:clean`), mit denen der Agent seinen Code vor dem Abschluss eigenständig validiert.

2. **CLAUDE.md ist die Single Source of Truth:**
   * Halte die `CLAUDE.md` hochkonzentriert, autoritativ und frei von langatmigen Erklärungen.
   * Sie enthält: Exakte Build-/Test-Befehle, Architekturregeln, Do's & Don'ts, Rechtsvorgaben und das Bereinigungsprotokoll.

3. **Workflow-Konvergenz: Research → Plan → Execute → Verify → Ship:**
   * Jeder größere Task folgt diesem linearen Pfad.
   * Keine Codeänderungen ohne vorherigen Plan bei komplexen Architekturentscheidungen.

4. **Kontext-Hygiene & Subagenten:**
   * Schwere Erkundungen, Datei-Scans und isolierte Aufgaben an Subagenten auslagern, um den Hauptchat schlank und präzise zu halten.
   * Context-Window gezielt managen (`/compact`, `/clear`, `/resume`).

---

## 2. Die Command → Agent → Skill Architektur

```
┌─────────────────────────────────────────────────────────────┐
│  1. COMMAND (Einstiegspunkt / User-Intent)                  │
│     Z.B. /goal, /grill-me, /code-review                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  2. AGENT (Orchestrierer / Rolle)                           │
│     Subagenten mit spezifischen Berechtigungen & Tools      │
│     (z. B. Research Agent, Reviewer Agent)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  3. SKILL (Spezifisches Fachwissen / Handlungsanweisung)    │
│     Z.B. ui-ux-pro-max, emil-design-eng, apple-design,      │
│     next-dev-loop, firebase-security-rules-auditor          │
└─────────────────────────────────────────────────────────────┘
```

* **Agent Skills (Preloaded):** Wissen wird direkt in den System-Prompt des Subagenten geladen.
* **Invoked Skills:** Werden bei Bedarf dynamisch zur Laufzeit konsultiert.

---

## 3. Memory & Rules Hierarchie

* **Ancestor Loading (Aufwärts):** Claude lädt beim Start die `CLAUDE.md` im Arbeitsverzeichnis und wandert bei Monorepos im Baum nach oben.
* **Descendant Loading (Abwärts / Lazy):** Regeln in Unterordnern werden erst geladen, wenn Dateien in diesem Ordner bearbeitet werden.
* **Projekt-Regeln:** In `.agents/rules/` oder `.claude/rules/` für thematische Aufteilung (z. B. `legals.md`, `project-rules.md`).

---

## 4. Git Worktrees & Commit-Disziplin

* **Atomare Commits:** Jeder abgeschlossene Task erhält einen präzisen, semantischen Commit (`feat:`, `fix:`, `refactor:`, `test:`).
* **Saubere Working Trees:** Test-Artefakte (`test-results/`, Berichte) und temporäre Testdatenbankeinträge werden vor dem Commit restlos entfernt.
* **Isolierte Entwicklung:** Größere Experimente oder parallele Agenten-Tasks über Git-Worktrees isolieren (`--worktree`).

---

## 5. Checkliste für neue Features & Module

Bei jedem neuen Feature in zukünftigen Sessions:
1. [ ] **Konsultation relevanter Skills:** z. B. `ui-ux-pro-max`, `emil-design-eng`, `apple-design`.
2. [ ] **Architektur-Check:** Einhaltung von Server Actions, Base UI Konventionen und Lucide-Icons.
3. [ ] **Automatisierter Test:** Playwright E2E- oder Komponententest anlegen oder erweitern.
4. [ ] **Build & Clean:** `npm run build` → `npm run test:all` → `npm run test:clean`.
5. [ ] **Commit & Push:** Semantischer Commit und Push auf den Remote-Branch.
