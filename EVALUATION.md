# Event readiness — PyConcept

**Author:** Nishant Kumar · **Branch:** CSEAI · **Roll:** 26CSEAI42

## What the supplied event guide actually asks for

Source: [Python Concept-to-Experience Challenge — Advanced Edition](https://drive.google.com/file/d/1uLZEqySOAp4dm83yFiQMfTuO-N2ylzLZ/view).
Relevant sections: overview (page 2), simulator recipe (page 4), Sets (page 18), OOP (page 27), final checklist (page 30).

This is a build/presentation guide, **not a numerical marking rubric**. It gives no official scoring weights or ranking guarantee. Each student explains their assigned topic. This existing repository offers two independent topic paths; present the assigned one, not both mixed together.

| Guide requirement | Where to demonstrate it |
| --- | --- |
| Topic title and beginner explanation | Each topic introduction and guided lesson |
| Clear visual and animation | Sets Venn lab; OOP blueprint/stamp lab; guided state transitions |
| Next / Play / Reset / speed | Each independent guided lesson and existing lab controls |
| Highlighted current code line | Guided lesson code panel and lab step trace |
| Output/state panel | Guided printed-output and state panels; existing lab outputs |
| Sets: input A/B, operations, Venn regions | Topic 14 lab; guided example focuses only on duplicates and intersection |
| OOP: blueprint, objects, attributes, self, initialization, method output | Topic 23 guided lesson and separate OOP lab |
| Python output correctness | Automated checks execute both guided examples and an OOP subset example with real Python |
| Phone and laptop layout | Desktop browser checked; 390px iframe viewport inspected for Sets. Real-device verification remains necessary |
| Online availability | Existing public site exists; these local changes still require push/deployment verification |
| 2–3 minute explanation | Suggested scripts below |

A real interpreter, login, database, payment or API is **not required** by the guide. The guide explicitly permits prepared JavaScript simulator steps. The optional Python runtime and AI tutor are not prerequisites for either new lesson. A quiz is optional.

## Changes in this upgrade

- Visible `Nishant Kumar · CSEAI` footer attribution and author metadata; corrected README name spelling while retaining the existing roll number.
- Separate Topic 14 and Topic 23 start buttons, prepared examples, prediction checks, timers, progress, reset and focus state. No shared learner progress between the topics.
- Sets lesson: duplicate removal, intersection, unchanged inputs and the distinction between undefined state and a computed set.
- OOP lesson: class definition, two initialization calls, `self.name`, separate instances, changing only one object's attribute, method-body return and subsequent print output.
- Tokenize Python source before producing escaped syntax markup, avoiding the earlier visible HTML-fragment defect.
- Bounded set literals distinguish `{}` (dict) from `set()`; handle quoted commas/hash symbols, empty strings, duplicates and safe numeric literals. Unsupported/unsafe values are rejected rather than rounded or guessed.
- Comma-separated text inputs remain strings: `01` is not silently changed to `1`. Empty inputs do not substitute demo students. Generated filtered split comprehensions match the trace; unfiltered supported comprehensions retain the empty-string member.
- Preserve quoted print arguments and comma-containing strings. Unsupported expressions now produce explicit limitations in the improved paths instead of being printed as fabricated results.
- Clear old lab steps on reset/edit/new run; guard empty step navigation; pause playback on page changes/hidden tabs; apply speed changes while playing.
- Correct `self`, `__new__`, `__init__`, attribute privacy and average-case membership wording. Remove the OOP trace's misleading `Verified` badge. Demo memory IDs and opcode labels are explicitly illustrative.
- Add dependency-free Node/Python regression checks and a GitHub Actions workflow. The workflow is added locally; a hosted Actions run has not yet been observed.

## Validation evidence and limits

Run:

```sh
node --test tests/learning.test.cjs
```

**Local result: 33 tests passed, 0 failed.** Tests cover escaping/highlighting, comments and brackets in strings, supported set literals, unsupported values, four set operations, unchanged inputs, argument splitting, inline-script syntax, attribution and required assets. The actual Sets lab step builder is exercised for generated text input, empty input, invalid edits and unfiltered split semantics. The actual OOP subset step builder is checked for separate object snapshots, method output matching Python, invalid-edit cleanup and unsupported top-level statements. DOM rendering is stubbed in these step-builder tests; they are not browser E2E tests.

Manual local browser checks performed:

- Home displays author attribution and the separate lesson entry points.
- Sets guided Play reaches `{3}`, step 4/4, with Next disabled at the end.
- OOP guided Play reaches two lines, `Hi, Mira` and `Hi, Kabir`, step 12/12; Reset and Continue to OOP Lab were clicked and the default OOP lab starts a trace.
- Default Sets lab starts a trace; displayed Python no longer contains the previously leaked highlighter markup.
- A temporary 390px-wide iframe viewport was inspected: Sets lesson stacks vertically, Next updates state, and controls fit. The scratch harness was removed. This is not testing on physical mobile hardware.

**Not claimed:** exhaustive correctness of every original feature, all 100 quiz questions, all custom Python, real-device/mobile Safari coverage, full WebGL coverage, hosted Actions success, optional backend security audit, Pyodide/API/AI tutor end-to-end validation, remote deployment or an official ranking.

The legacy editable visualizers remain **bounded teaching models**, not Python interpreters. OOP input steps substitute preset demo values; they are not interactive stdin execution. For general code, complex expressions, inheritance or unsupported statements, use **Run Python 3**. Some legacy parser limitations remain; the explicit fixed guided lessons are the recommended presentation path. Set output order is not guaranteed by Python. Syntax coloring is not a Python syntax validator. External fonts, 3D libraries and the optional Python runtime may need network access; the new guide assets are local and have no runtime/CDN dependency.

## Two-minute presentation: Sets only

1. 0:00–0:20 — Define a set: unique items, unordered, no positional indexing.
2. 0:20–0:40 — Predict the result before stepping. Explain why the second `2` disappears.
3. 0:40–1:15 — Step through A, B and `A & B`; point to the shared region. Show that A/B remain unchanged.
4. 1:15–1:40 — Show printed `{3}`. Reset, then use Play and change the step delay.
5. 1:40–2:00 — Open the Sets Lab for editable A/B. Ask: how would union differ from intersection?

## Two-minute presentation: OOP only

1. 0:00–0:20 — A class supplies behavior; an instance stores its own attributes.
2. 0:20–0:55 — Step into the first initialization: `self.name = name`. Show a second object with a different `self`.
3. 0:55–1:20 — Change only s1 from Asha to Mira. Point out that s2 stays Kabir.
4. 1:20–1:45 — Step into `introduce()`. Explain that return produces a value and print writes it to the console.
5. 1:45–2:00 — Show both greetings, Reset, then open the OOP Lab. Ask: what does `self` refer to?

## Before public presentation

- Deploy the commit and check the actual hosted URL, not only localhost.
- Test Next, Play/Pause, Back, Reset, replay, speed, prediction and navigation on the assigned topic.
- Check the actual phone and laptop being used, including readable text and unobscured controls.
- If demonstrating custom code, compare with real Python first; do not imply the visual parser supports arbitrary Python.
- Keep credentials out of source, Git remotes, commits, screenshots and chat. Rotate any credential already shared in chat.
