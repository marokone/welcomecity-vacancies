import json
from bs4 import BeautifulSoup
import re

# Ключевые слова для поиска блоков (на случай если description заполнен старым способом)
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

def clean_html(html):
    """Убирает HTML-теги и возвращает чистый текст"""
    if not html:
        return ''
    soup = BeautifulSoup(html, 'html.parser')
    return soup.get_text('\n', strip=True)

def get_custom_field_value(custom_fields, system_name):
    """Достаёт значение кастомного поля по SystemName"""
    for field in custom_fields:
        if field.get('SystemName') == system_name:
            return clean_html(field.get('Value', ''))
    return ''

def main():
    with open('jobs_full.json', encoding='utf-8') as f:
        jobs = json.load(f)
    
    for job in jobs:
        custom_fields = job.get('customFieldValues', [])
        
        # ОТЛАДКА: показываем что нашли
        print(f"\n=== JOB {job.get('jobId')} ===")
        print(f"Кастомных полей: {len(custom_fields)}")
        
        # Достаём кастомные поля
        requirements = get_custom_field_value(custom_fields, 'Toruk_Job_Requirements')
        responsibilities = get_custom_field_value(custom_fields, 'Toruk_Job_Responsibilities')
        conditions = get_custom_field_value(custom_fields, 'Toruk_Job_Conditions')
        
        # ОТЛАДКА: показываем что получили
        print(f"Requirements: {len(requirements)} символов")
        print(f"Responsibilities: {len(responsibilities)} символов")
        print(f"Conditions: {len(conditions)} символов")
        
        # Если кастомные поля заполнены — используем их
        if requirements or responsibilities or conditions:
            print("✅ Используем кастомные поля")
            job['description_structured'] = {
                'описание': clean_html(job.get('description', '')),
                'требования': requirements,
                'обязанности': responsibilities,
                'условия': conditions
            }
        else:
            print("⚠️ Кастомные поля пустые, парсим description")
            # Иначе пытаемся распарсить старым способом из description
            desc = job.get('description') or ''
            job['description_structured'] = extract_blocks(desc)
    
    with open('jobs_structured.json', 'w', encoding='utf-8') as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    
    print("\n✅ Готово! Сохранено в jobs_structured.json")

if __name__ == '__main__':
    main()
