"""Vercel Serverless Function — /api/run-python (sandboxed Python code runner)."""
from http.server import BaseHTTPRequestHandler
import json
import re
import subprocess
import sys
import tempfile
import os
import time

BLOCKED_PATTERNS = re.compile(
    r"\b(import\s+(os|subprocess|socket|shutil|sys|ctypes|importlib|pty|pathlib|urllib|http|multiprocessing)|"
    r"from\s+(os|subprocess|socket|shutil|sys|ctypes|importlib|pty|pathlib|urllib|http)\b|"
    r"__import__|open\s*\(|eval\s*\(|exec\s*\()"
)


def run_python_code(code: str, stdin_data: str = "") -> dict:
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
        return {"ok": False, "stdout": "", "stderr": "TimeoutError: Execution timed out after 5.0 seconds.", "returncode": 124, "elapsed_ms": 5000.0}
    except Exception as exc:
        return {"ok": False, "stdout": "", "stderr": str(exc), "returncode": 1, "elapsed_ms": 0.0}


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

        code = body.get("code", "")
        stdin_data = body.get("stdin", "")
        res = run_python_code(code, stdin_data)
        self._json(200, res)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

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
