# PyConcept Explorer — Interactive Python Visualizers

An interactive Liquid Glass web app covering **Topic 14: Sets** and **Topic 23: Object-Oriented Programming**, designed to work both locally (with Python `pyttsx3` TTS) and statically on GitHub Pages (with Web Speech fallback).

## Included Topics
- **Topic 14 — Sets**:
  - **12-Concept Interactive Visual Explorer** (Set idea, Roster vs Set-builder filter machine, `∈ / ∉` membership, Types of sets, Subset vs Proper Subset, Universal Set, Power Set `P(A)`, Venn Operations, Set Identities/Laws, Cardinality `n(A∪B)`, Intervals & Number Line, Cartesian Product `A × B`).
  - **Sets Python Lab**: Editable Python code editor with syntax checks, step-by-step execution trace, and live output.
- **Topic 23 — Object-Oriented Programming**:
  - **OOP Intro**: Blueprint (`class Student`) visual and interactive flip cards.
  - **OOP Code Lab**: Editable Python code editor with default `Student` class, syntax validation, Object Panel cards, and Programiz-style Call Frames (`Main Block` → active `__init__` / method frame).
- **Quiz Portal**: 1-question-at-a-time interactive quiz for Sets & OOP with Question Palette, Review, and Read Aloud (`🔊`).

## Run Locally (With Python TTS)
```bash
python3 server.py
```
Then open http://127.0.0.1:8095/ in your browser.

## Deploy on GitHub Pages
Enable **Settings → Pages → main / (root)** in your repository — `index.html` works standalone with automatic browser speech synthesis fallback.
