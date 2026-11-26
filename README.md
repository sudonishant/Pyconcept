# PyConcept — Python Sets & OOP Visual Lab

Interactive visual learning studio for **Topic 14 (Sets)** and **Topic 23 (Object-Oriented Programming)** featuring 2D/3D WebGL visualizers, an in-browser **Python 3 Compiler (Pyodide)**, a **100-question Quiz Portal**, and **PyBot AI Tutor**.

## Live Deployment (Vercel)
- **URL:** [https://pyconcept.neeshant.in/](https://pyconcept.neeshant.in/)
- Runs completely in the browser as a static site on Vercel:
  - Python 3 code executes client-side via **Pyodide (WebAssembly)** with full `input()` / `stdin` support.
  - PyBot AI Tutor supports Bring-Your-Own-Key (BYOK) OpenRouter keys stored in `sessionStorage`.
  - Text-to-Speech uses the browser SpeechSynthesis API.

## Local Development
```bash
git clone https://github.com/sudonishant/Pyconcept.git
cd Pyconcept
python3 server.py
```
Open **http://127.0.0.1:8095/** in your browser.

### Optional Environment Variables (Local Server)
- `OPENROUTER_API_KEY`: Enables the `/api/chat` OpenRouter proxy for PyBot.
- `PYCONCEPT_API_TOKEN`: Optional auth token required on `POST` endpoints when set.

## Features
- **Topic 14 — Sets:** 12 visual concepts, Multi-Venn diagrams (2-Set, 3-Set, Subset, Disjoint) in 2D SVG & 3D Three.js, Set Membership (`∈` / `∉`), and CPython Hash Table tracer.
- **Topic 23 — OOP:** Blueprint Stamp Press (`Custom`, `Auto`, `From Code`), 3D Hydraulic Stamp & Heap/Stack pointer beams, Student ID cards, Call Frames, plus all 4 Pillars (Inheritance, Encapsulation, Abstraction, Polymorphism) & Advanced OOP (Dunders, Decorators, MRO).
- **100-Question Quiz Portal:** 50 Sets + 50 OOP questions, configurable question count (5–100), countdown timer, question palette, and `localStorage` activity log.
