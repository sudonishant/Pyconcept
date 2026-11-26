#!/usr/bin/env python3
"""Local HTTP server for Topic 14 (Sets) & Topic 23 (OOP) Studio with sandboxed Python 3 runner, OpenRouter proxy, and pyttsx3 TTS API."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import json
import os
import subprocess
import sys
import tempfile
import threading
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent

import time

import re as _re
from collections import defaultdict as _defaultdict

RATE_LOCK = threading.Lock()
RATE_LOG: dict[str, list[float]] = _defaultdict(list)
BLOCKED_PATTERNS = _re.compile(
    r"\b(import\s+(os|subprocess|socket|shutil|sys|ctypes|importlib|pty|pathlib|urllib|http|multiprocessing)|"
    r"from\s+(os|subprocess|socket|shutil|sys|ctypes|importlib|pty|pathlib|urllib|http)\b|"
    r"__import__|open\s*\(|eval\s*\(|exec\s*\()"
)


def is_rate_limited(ip: str, limit: int = 20, window_sec: float = 60.0) -> bool:
    now = time.time()
    with RATE_LOCK:
        stamps = [t for t in RATE_LOG[ip] if now - t < window_sec]
        if len(stamps) >= limit:
            RATE_LOG[ip] = stamps
            return True
        stamps.append(now)
        RATE_LOG[ip] = stamps
        return False


def run_python_code(code: str, stdin_data: str = "") -> dict:
    """Execute user Python code in an isolated subprocess with security limits."""
    if len(code) > 5000:
        return {"ok": False, "stdout": "", "stderr": "SecurityError: Code exceeds 5000 character limit.", "returncode": 1, "elapsed_ms": 0.0}
    if len(stdin_data) > 2000:
        return {"ok": False, "stdout": "", "stderr": "SecurityError: Standard input exceeds 2000 character limit.", "returncode": 1, "elapsed_ms": 0.0}
    m = BLOCKED_PATTERNS.search(code)
    if m:
        return {"ok": False, "stdout": "", "stderr": f"SecurityError: Restricted operation '{m.group(0)}' is blocked in sandbox mode.", "returncode": 1, "elapsed_ms": 0.0}
    t0 = time.perf_counter()
    try:
        proc = subprocess.run(
            [sys.executable, "-I", "-c", code],
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=5,
        )
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "ok": proc.returncode == 0,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
            "elapsed_ms": elapsed_ms,
        }
    except subprocess.TimeoutExpired:
        return {
            "ok": False,
            "stdout": "",
            "stderr": "TimeoutError: Execution timed out after 5.0 seconds.",
            "returncode": 124,
            "elapsed_ms": 5000.0,
        }
    except Exception as exc:
        return {
            "ok": False,
            "stdout": "",
            "stderr": str(exc),
            "returncode": 1,
            "elapsed_ms": 0.0,
        }



def get_openrouter_key() -> str:
    """Return OpenRouter API key from environment or local .env file."""
    env_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if env_key:
        return env_key
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("OPENROUTER_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""
TTS_LOCK = threading.Lock()
TTS_CACHE: dict[tuple[str, str], bytes] = {}

VOICE_MAP = {
    "en-us": "gmw/en-us",
    "en-gb": "gmw/en-gb-x-rp",
    "hi": "inc/hi",
}

SYNTH_SNIPPET = r"""
import sys, pyttsx3
text, voice_id, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
e = pyttsx3.init()
e.setProperty("rate", 168)
for v in e.getProperty("voices"):
    if v.id == voice_id:
        e.setProperty("voice", v.id)
        break
e.save_to_file(text, out_path)
e.runAndWait()
"""


def synthesize_wav(text: str, voice_key: str = "en-us") -> bytes:
    """Synthesize speech audio as WAV bytes in an isolated subprocess (never deadlocks)."""
    clean = " ".join(text.strip().split())[:280]
    if not clean:
        return b""
    cache_key = (voice_key, clean)
    if cache_key in TTS_CACHE:
        return TTS_CACHE[cache_key]

    with TTS_LOCK:
        if cache_key in TTS_CACHE:
            return TTS_CACHE[cache_key]
        target_id = VOICE_MAP.get(voice_key, "gmw/en-us")
        fd, tmp_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        try:
            subprocess.run(
                [sys.executable, "-c", SYNTH_SNIPPET, clean, target_id, tmp_path],
                check=True,
                timeout=8,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            data = Path(tmp_path).read_bytes()
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

        if len(TTS_CACHE) > 80:
            TTS_CACHE.clear()
        TTS_CACHE[cache_key] = data
        return data


class StudioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Connection", "close")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            payload = json.dumps({
                "ok": True,
                "tts": "pyttsx3",
                "voices": list(VOICE_MAP.keys()),
                "ai": bool(get_openrouter_key()),
            }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if parsed.path == "/api/tts":
            qs = parse_qs(parsed.query)
            text = (qs.get("text") or [""])[0]
            voice = (qs.get("voice") or ["en-us"])[0]
            try:
                wav = synthesize_wav(text, voice)
                if not wav:
                    self.send_error(400, "Missing text parameter")
                    return
                self.send_response(200)
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(wav)))
                self.send_header("Cache-Control", "public, max-age=3600")
                self.end_headers()
                self.wfile.write(wav)
            except Exception as exc:
                msg = json.dumps({"error": str(exc)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(msg)))
                self.end_headers()
                self.wfile.write(msg)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        client_ip = self.client_address[0] if self.client_address else "unknown"
        if is_rate_limited(client_ip, limit=20, window_sec=60.0):
            msg = json.dumps({"error": "Rate limit exceeded (20 requests/min). Please wait."}).encode("utf-8")
            self.send_response(429)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        expected_token = os.environ.get("PYCONCEPT_API_TOKEN", "").strip()
        if expected_token and self.headers.get("X-PyConcept-Token", "").strip() != expected_token:
            msg = json.dumps({"error": "Unauthorized: invalid API token."}).encode("utf-8")
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return
        if parsed.path == "/api/run-python":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length > 0 else b"{}"
            try:
                body = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_error(400, "Invalid JSON")
                return
            code = body.get("code", "")
            stdin_data = body.get("stdin", "")
            res = run_python_code(code, stdin_data)
            out = json.dumps(res).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)
            return

        if parsed.path != "/api/chat":
            self.send_error(404, "Not found")
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except Exception:
            self.send_error(400, "Invalid JSON")
            return

        api_key = get_openrouter_key() or self.headers.get("X-OpenRouter-Key", "").strip()
        if not api_key:
            msg = json.dumps({"error": "OPENROUTER_API_KEY is not configured."}).encode("utf-8")
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        topic = body.get("topic", "Python")
        code = (body.get("code") or "")[:1500]
        messages = body.get("messages") or []
        sys_prompt = (
            f"You are PyBot, a friendly, concise Python tutor inside PyConcept Explorer (currently viewing: {topic}). "
            "Explain Sets (Venn diagrams, union, intersection, difference, subsets, power set, cardinality, intervals, Cartesian product) "
            "and Object-Oriented Programming (classes, blueprints, __init__, self, objects) clearly in plain English. "
            "Keep answers short, practical, and include small Python snippets when helpful."
        )
        if code.strip():
            sys_prompt += f"\n\nCurrent code in the user's editor:\n```python\n{code}\n```"

        req_payload = json.dumps({
            "model": body.get("model") or "openrouter/free",
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
                "HTTP-Referer": "http://127.0.0.1:8095/",
                "X-Title": "PyConcept Explorer",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                reply = data["choices"][0]["message"]["content"]
                out = json.dumps({"reply": reply, "model": data.get("model", "openrouter")}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(out)))
                self.end_headers()
                self.wfile.write(out)
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="ignore")
            out = json.dumps({"error": f"OpenRouter HTTP {exc.code}: {err_body[:220]}"}).encode("utf-8")
            self.send_response(exc.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)
        except Exception as exc:
            out = json.dumps({"error": str(exc)}).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    host, port = "127.0.0.1", 8095
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer((host, port), StudioHandler)
    print(f"Serving Topic 25 Studio + Python TTS on http://{host}:{port}/", flush=True)
    server.serve_forever()
