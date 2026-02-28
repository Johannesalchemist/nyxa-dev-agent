# NYXA ARCHITECTURE A
## Deterministischer Evolutionskern

---

## 1. Zustandsdefinition

Ein Zustand Z ist exakt definiert als:

Z := Git Commit Hash

Nicht HEAD.
Nicht Branch.
Nicht Working Directory.

Der Commit-Hash ist die Identitätseinheit des Systems.

---

## 2. Rekonstruierbarkeit

Für jeden Zustand Z gilt:

checkout(Z) → deterministische Projektstruktur

Der Zustand muss vollständig reproduzierbar sein.

---

## 3. Bewertung

Fitness ist eine reine Funktion:

Fitness(Z) = f(Z)

Keine Nutzung von HEAD.
Keine Nutzung von uncommitted changes.
Keine implizite Zeitabhängigkeit.

---

## 4. Mutation

Mutation ist definiert als:

Mutate(Zₙ) → Zₙ₊₁

Technisch:
- Änderung
- Commit
- Neuer Hash

Keine In-Place-Änderungen ohne Commit.

---

## 5. Meta-Ebene

meta.json ist Verwaltung.

meta ≠ Zustand

meta.lastCommitHash muss einem gültigen Commit entsprechen,
definiert aber nicht selbst den Zustand.

---

## 6. Konsistenz-Invarianten

Ein Zustand Z ist konsistent, wenn:

1. summary.head == Z
2. meta.lastCommitHash == Z
3. fileCount == length(scanProjectFiles(Z))
4. Working Tree ist clean

---

## 7. Verbotene Zustände

Ungültig sind:

- summary.head == live HEAD
- Fitness ohne Commit
- Bewertung auf Dirty State
- Implizite Mutation

---

## 8. Minimaler Zyklus

build
run (commit)
updateSummary(Z)
validate(Z)

Keine implizite Rekursion.
Keine automatische Selbstmutation.

---

## Kerninvariante

Zustand ist diskret.
Bewertung ist deterministisch.
Mutation ist explizit.
