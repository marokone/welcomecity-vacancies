import json
import csv
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
    ('requirements', lambda j: get_custom_field(j, 'Toruk_Job_Requirements')),
    ('responsibilities', lambda j: get_custom_field(j, 'Toruk_Job_Responsibilities')),
    ('conditions', lambda j: get_custom_field(j, 'Toruk_Job_Conditions')),
    ('created_at', 'dateCreated'),
    ('updated_at', 'dateUpdated'),
    ('status', 'CONST_ACTIVE'),
]

def clean_html(text):
    """Очистка HTML тегов"""
    if not text:
        return ''
    # Простая очистка - можно добавить более сложную если нужно
    return text.replace('<p>', '\n').replace('</p>', '\n').replace('<br />', '\n').replace('<ul>', '\n').replace('</ul>', '\n').replace('<li>', '• ').replace('</li>', '\n')

def get_custom_field(job, system_name):
    """Получение значения из customFieldValues"""
    custom_fields = job.get('customFieldValues', [])
    for field in custom_fields:
        if field.get('SystemName') == system_name:
            return clean_html(field.get('Value', ''))
    return ''

def get_value(job, key, org_map=None):
    # Специальный случай для статуса
    if key == 'CONST_ACTIVE':
        return 'active'
    
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
    
    with open('jobs_supabase.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([f[0] for f in FIELDS])
        
        stats = {'requirements': 0, 'responsibilities': 0, 'conditions': 0}
        
        for job in jobs:
            row = [get_value(job, f[1], org_map=org_map) for f in FIELDS]
            
            # Статистика
            if row[7]: stats['requirements'] += 1  # requirements
            if row[8]: stats['responsibilities'] += 1  # responsibilities
            if row[9]: stats['conditions'] += 1  # conditions
            
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

if __name__ == '__main__':
    main()
