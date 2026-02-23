import json
import csv
import re
from datetime import datetime

# Какие поля нужны для Supabase
FIELDS = [
    ('job_id', 'jobId'),
    ('jobtype_id', lambda j: j.get('jobType', {}).get('id') if j.get('jobType') else ''),
    ('jobtype_name', lambda j: j.get('jobType', {}).get('name') if j.get('jobType') else ''),
    ('title', 'name'),
    ('project', lambda j, org_map=None: get_project_department(j, org_map)[0]),
    ('department', lambda j, org_map=None: get_project_department(j, org_map)[1]),
    ('description', lambda j: clean_html(j.get('description', ''))),
    ('requirements', lambda j: normalize_list_format(get_custom_field_raw(j, 'Toruk_Job_Requirements'))),
    ('responsibilities', lambda j: normalize_list_format(get_custom_field_raw(j, 'Toruk_Job_Responsibilities'))),
    ('conditions', lambda j: normalize_list_format(get_custom_field_raw(j, 'Toruk_Job_Conditions'))),
    ('created_at', 'dateCreated'),
    ('updated_at', 'dateUpdated'),
    ('status', lambda j: determine_status(j)),  # Изменено!
]

def determine_status(job):
    """Определяет статус вакансии на основе заполненности полей"""
    # Получаем значения полей
    description = job.get('description', '')
    requirements = get_custom_field_raw(job, 'Toruk_Job_Requirements')
    responsibilities = get_custom_field_raw(job, 'Toruk_Job_Responsibilities')
    conditions = get_custom_field_raw(job, 'Toruk_Job_Conditions')
    
    # Очищаем от HTML-тегов для проверки
    def has_content(text):
        if not text:
            return False
        # Убираем HTML-теги
        clean = re.sub(r'<[^>]+>', '', text)
        # Убираем маркеры списков и пробелы
        clean = re.sub(r'^[•\-*\d.]+\s*', '', clean)
        clean = clean.strip()
        return len(clean) > 10  # Хотя бы 10 символов содержательного текста
    
    # Проверяем заполненность всех полей
    all_fields_filled = (
        has_content(description) and
        has_content(requirements) and
        has_content(responsibilities) and
        has_content(conditions)
    )
    
    # Возвращаем статус
    return 'active' if all_fields_filled else 'archived'

def normalize_list_format(text):
    """Преобразует любой формат списка в единый HTML-список"""
    if not text:
        return ''
    
    # Если текст уже содержит правильный HTML-список, оставляем как есть
    if '<ul style="margin:0; padding-left:20px; list-style-type:disc;"' in text:
        return text
    
    # Если есть HTML-теги, извлекаем текст
    if '<li>' in text:
        # Извлекаем текст из li
        items = re.findall(r'<li[^>]*>(.*?)</li>', text, re.DOTALL)
        if items:
            # Очищаем от внутренних тегов
            clean_items = []
            for item in items:
                clean_item = re.sub(r'<[^>]+>', '', item).strip()
                if clean_item:
                    clean_items.append(clean_item)
            return create_html_list(clean_items)
    
    # Разбиваем на строки
    lines = text.split('\n')
    items = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Убираем маркеры списка в начале (•, -, *, цифры и т.д.)
        line = re.sub(r'^[•\-*\d.]+\s*', '', line)
        # Убираем HTML-теги
        line = re.sub(r'<[^>]+>', '', line)
        # Убираем множественные пробелы
        line = re.sub(r'\s+', ' ', line).strip()
        
        # Исправляем HTML-сущности
        line = fix_html_entities(line)
        
        if line:
            items.append(line)
    
    if not items:
        return fix_html_entities(text)
    
    return create_html_list(items)

def create_html_list(items):
    """Создаёт HTML-список из массива элементов"""
    list_html = '<ul style="margin:0; padding-left:20px; list-style-type:disc;">'
    for item in items:
        # Добавляем точку в конце, если её нет
        if item and not item[-1] in '.!?':
            item += '.'
        list_html += f'<li style="margin-bottom:8px; line-height:1.5;">{item}</li>'
    list_html += '</ul>'
    return list_html

def fix_html_entities(text):
    """Исправляет HTML-сущности"""
    if not text:
        return text
    
    replacements = {
        '&mdash;': '—',
        '&mdash': '—',
        '&laquo;': '«',
        '&raquo;': '»',
        '&nbsp;': ' ',
        '&nbsp': ' ',
        '&amp;': '&',
        '&amp': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
    }
    
    for entity, char in replacements.items():
        text = text.replace(entity, char)
    
    return text

def clean_html(text):
    """Очистка HTML тегов для описания"""
    if not text:
        return ''
    
    # Заменяем экранированные \n на реальные переносы
    text = text.replace('\\n', '\n')
    
    # Обрабатываем HTML-теги
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<p>', '\n', text)
    text = re.sub(r'</p>', '\n', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # Нормализуем переносы
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r' +', ' ', text)
    
    # Исправляем HTML-сущности
    text = fix_html_entities(text)
    
    return text.strip()

def get_custom_field_raw(job, system_name):
    """Получение сырого значения из customFieldValues без очистки"""
    custom_fields = job.get('customFieldValues', [])
    for field in custom_fields:
        if field.get('SystemName') == system_name:
            return field.get('Value', '')
    return ''

def get_value(job, key, org_map=None):
    if callable(key):
        try:
            return key(job, org_map=org_map)
        except TypeError:
            return key(job)
    return job.get(key, '')

def get_project_department(job, org_map):
    org_unit = job.get('organizationUnit')
    if not org_unit or not isinstance(org_unit, dict):
        return ('', '')
    fk = org_unit.get('foreignKey')
    if not fk:
        return ('', '')
    dept = org_map.get(fk)
    if not dept:
        return ('', '')
    dept_name = dept.get('name', '')
    parent_fk = dept.get('parentForeignKey')
    if parent_fk:
        project = org_map.get(parent_fk)
        project_name = project.get('name', '') if project else ''
    else:
        project_name = dept_name
    return (project_name, dept_name)

def main():
    # Загружаем справочник подразделений
    with open('organization_units.json', encoding='utf-8') as f_org:
        org_data = json.load(f_org)
        org_map = {unit['foreignKey']: unit for unit in org_data['organizationUnits']}

    with open('jobs_full.json', encoding='utf-8') as f:
        jobs = json.load(f)
    
    print(f"📥 Загружено вакансий из API: {len(jobs)}")
    
    # Статистика по статусам
    status_stats = {'active': 0, 'archived': 0}
    
    with open('jobs_supabase.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([f[0] for f in FIELDS])
        
        stats = {'requirements': 0, 'responsibilities': 0, 'conditions': 0}
        
        for job in jobs:
            row = [get_value(job, f[1], org_map=org_map) for f in FIELDS]
            
            # Статистика по полям
            if row[7]: stats['requirements'] += 1
            if row[8]: stats['responsibilities'] += 1
            if row[9]: stats['conditions'] += 1
            
            # Статистика по статусам (статус в 12-й колонке)
            status_stats[row[12]] = status_stats.get(row[12], 0) + 1
            
            # Преобразуем даты в ISO, если есть
            for i, field in enumerate([f[0] for f in FIELDS]):
                if field in ('created_at', 'updated_at') and row[i]:
                    try:
                        row[i] = datetime.fromisoformat(row[i]).isoformat()
                    except Exception:
                        pass
            writer.writerow(row)
        
        print(f"✅ Создан jobs_supabase.csv")
        print(f"📊 Статистика по кастомным полям:")
        print(f"  - Требования: {stats['requirements']} вакансий")
        print(f"  - Обязанности: {stats['responsibilities']} вакансий")
        print(f"  - Условия: {stats['conditions']} вакансий")
        print(f"📊 Статистика по статусам:")
        print(f"  - Активных: {status_stats['active']} вакансий")
        print(f"  - В архиве: {status_stats['archived']} вакансий")

if __name__ == '__main__':
    main()
