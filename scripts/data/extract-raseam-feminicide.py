"""One-off extraction of the reviewed RASEAM 2026 edition (not a live collector).

Usage: python scripts/data/extract-raseam-feminicide.py path/to/raseam-2026.pdf
Visually verify PDF pages 459–460 (printed pages 467–468) before committing.
"""
import hashlib
import json
from pathlib import Path
import re
import sys
import unicodedata
import pdfplumber

pdf_path = Path(sys.argv[1])
dashboard = json.loads(Path('public/data/mundialidade.json').read_text(encoding='utf-8'))
def normalized(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text) if not unicodedata.combining(c)).lower()

states = {normalized(state['name']): state for state in dashboard['brazilStates']}
tables = []
with pdfplumber.open(pdf_path) as pdf:
    for page_index, year, table in [(459, 2024, '5.37b'), (458, 2025, '5.37a')]:
        text = pdf.pages[page_index].extract_text()
        assert f'Tabela {table}' in text and f'- {year}' in text
        records = []
        for line in text.splitlines():
            match = re.fullmatch(r'(.+?) ([\d.]+) ([\d.]+) (\d+,\d)', line)
            if not match:
                continue
            name, total, population, rate = match.groups()
            state = {'code': 'BRA', 'name': 'Brasil'} if name == 'Brasil' else states[normalized(name)]
            records.append({**state, 'victims': int(total.replace('.', '')), 'femalePopulation': int(population.replace('.', '')), 'rate': float(rate.replace(',', '.'))})
        assert len(records) == 28
        tables.append({'year': year, 'table': table, 'printedPage': page_index + 9, 'pdfPage': page_index + 1, 'records': records})

edition = {
    'edition': 'RASEAM 2026',
    'sourceUpdatedAt': '2026-02-20',
    'reviewedAt': '2026-09-27',
    'sourceUrl': 'https://www.gov.br/mulheres/pt-br/central-de-conteudos/publicacoes-1/raseam-2026-relatorio-anual-socioeconomico-da-mulher.pdf/@@display-file/file',
    'sha256': hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
    'license': 'Reprodução parcial ou total permitida com citação da fonte (expediente do RASEAM 2026).',
    'tables': tables,
}
Path('scripts/data/sources').mkdir(exist_ok=True)
Path('scripts/data/sources/raseam-2026-feminicide.json').write_text(json.dumps(edition, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
