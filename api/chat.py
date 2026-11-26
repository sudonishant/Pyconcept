"""Vercel Serverless Function — /api/chat (OpenRouter proxy for PyBot)."""
from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.error
import urllib.request


def get_openrouter_key() -> str:
    return os.environ.get("OPENROUTER_API_KEY", "").strip()


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except Exception:
            self._json(400, {"error": "Invalid JSON"})
            return

        api_key = get_openrouter_key() or self.headers.get("X-OpenRouter-Key", "").strip()
        if not api_key:
            self._json(401, {"error": "OPENROUTER_API_KEY is not configured."})
            return

        topic = body.get("topic", "Python")
        code = (body.get("code") or "")[:1500]
        messages = body.get("messages") or []

        sys_prompt = (
            f"You are PyBot, a friendly, concise Python tutor inside PyConcept Explorer "
            f"(currently viewing: {topic}). "
            "Explain Sets (Venn diagrams, union, intersection, difference, subsets, power set, "
            "cardinality, intervals, Cartesian product) and Object-Oriented Programming "
            "(classes, blueprints, __init__, self, objects) clearly in plain English. "
            "Keep answers short, practical, and include small Python snippets when helpful."
        )
        if code.strip():
            sys_prompt += f"\n\nCurrent code in the user's editor:\n```python\n{code}\n```"

        req_payload = json.dumps({
            "model": body.get("model") or "openrouter/auto",
            "messages": [{"role": "system", "content": sys_prompt}, *messages[-8:]],
            "max_tokens": 420,
            "temperature": 0.6,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=req_payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://pyconcept.neeshant.in/",
                "X-Title": "PyConcept Explorer",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                reply = data["choices"][0]["message"]["content"]
                self._json(200, {"reply": reply, "model": data.get("model", "openrouter")})
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="ignore")
            self._json(exc.code, {"error": f"OpenRouter HTTP {exc.code}: {err_body[:220]}"})
        except Exception as exc:
            self._json(500, {"error": str(exc)})

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-OpenRouter-Key")

    def _json(self, code: int, data: dict):
        out = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

    def log_message(self, format, *args):
        return
