#!/usr/bin/env python3
"""Emite JSON { "destId": 1-based-page-number } para named destinations de um PDF."""
import json
import sys

try:
    from pypdf import PdfReader
except ImportError:
    print(json.dumps({"error": "pypdf_missing"}))
    sys.exit(2)

path = sys.argv[1]
reader = PdfReader(path)
out: dict[str, int] = {}

try:
    nd = reader.named_destinations or {}
    for name, dest in nd.items():
        key = name if isinstance(name, str) else str(name)
        try:
            page_idx = reader.get_destination_page_number(dest)
            out[key] = int(page_idx) + 1
        except Exception:
            continue
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)

print(json.dumps(out, ensure_ascii=False))
