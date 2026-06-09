"""
Relay Proxy para Meelion — Google Cloud Function (Python 3.11+)
Contorna o WAF da Hostinger que bloqueia requests com Accept-Encoding.
Suporta injeção de cookies para acesso PRO.

Uso pelo Apps Script:
  UrlFetchApp.fetch(RELAY_URL + "?url=" + encodeURIComponent(meelionUrl) + "&token=TOKEN&cookie=" + encodeURIComponent(cookieStr))
"""

import functions_framework
import requests
import os
from urllib.parse import urlparse

RELAY_TOKEN = os.environ.get("RELAY_TOKEN", "")

@functions_framework.http
def relay(request):
    # CORS preflight
    if request.method == "OPTIONS":
        return ("", 204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        })

    # Validar token
    token = request.args.get("token", "")
    if RELAY_TOKEN and token != RELAY_TOKEN:
        return ({"error": "Token inválido"}, 403, {"Content-Type": "application/json"})

    # Validar URL
    url = request.args.get("url", "")
    if not url:
        return ({"error": "Parâmetro 'url' obrigatório"}, 400, {"Content-Type": "application/json"})

    # Só permitir domínios autorizados
    allowed_domains = ["www.meelion.com", "meelion.com"]
    parsed = urlparse(url)
    if parsed.hostname not in allowed_domains:
        return ({"error": "Domínio não autorizado: " + str(parsed.hostname)}, 403, {"Content-Type": "application/json"})

    # Parâmetro opcional: cookies para acesso PRO
    cookie_header = request.args.get("cookie", "")

    try:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        })

        if cookie_header:
            session.headers["Cookie"] = cookie_header

        response = session.get(url, timeout=45, allow_redirects=True)
        response.encoding = "utf-8"

        return (response.text, response.status_code, {
            "Content-Type": "text/html; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "X-Relay-Status": str(response.status_code),
            "X-Relay-Size": str(len(response.text)),
        })

    except requests.Timeout:
        return ({"error": "Timeout ao acessar " + url}, 504, {"Content-Type": "application/json"})
    except Exception as e:
        return ({"error": str(e)}, 502, {"Content-Type": "application/json"})
