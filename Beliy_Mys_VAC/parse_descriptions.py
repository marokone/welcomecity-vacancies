import json
from bs4 import BeautifulSoup
import re

# Ключевые слова для поиска блоков
BLOCKS = [
    ('описание', ['описание', 'о компании', 'о вакансии']),
    ('обязанности', ['обязанности', 'функциональные обязанности', 'чем предстоит заниматься']),
    ('условия', ['условия', 'мы предлагаем', 'что мы предлагаем']),
    ('требования', ['требования', 'кандидат', 'квалификация', 'что мы ожидаем'])
]

def extract_blocks(html):
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text('\n', strip=True)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    result = {k: '' for k, _ in BLOCKS}
    current = None
    for line in lines:
        l = line.lower()
        for key, variants in BLOCKS:
            if any(v in l for v in variants):
                current = key
                break
        if current:
            if result[current]:
                result[current] += '\n' + line
            else:
                result[current] = line
    # postprocess: remove headers from content
    for key, variants in BLOCKS:
        for v in variants:
            if result[key].lower().startswith(v):
                result[key] = result[key][len(v):].lstrip(': .-\n')
    return result

def main():
    with open('jobs_full.json', encoding='utf-8') as f:
        jobs = json.load(f)
    for job in jobs:
        desc = job.get('description') or ''
        job['description_structured'] = extract_blocks(desc)
    with open('jobs_structured.json', 'w', encoding='utf-8') as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
