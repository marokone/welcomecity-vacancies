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
    # Теперь берем поля напрямую из API!
    ('description', lambda j: j.get('description', '')),                    # из API
    ('requirements', lambda j: j.get('requirements', '')),                  # из API
    ('responsibilities', lambda j: j.get('responsibilities', '')),          # из API  
    ('conditions', lambda j: j.get('conditions', '')),                      # из API
    ('created_at', 'dateCreated'),
    ('updated_at', 'dateUpdated'),
    ('status', 'CONST_ACTIVE'),
]


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

    # Читаем напрямую из jobs_full.json (ответ API), а не из jobs_structured.json
    with open('jobs_full.json', encoding='utf-8') as f:
        jobs = json.load(f)
    
    print(f"📥 Загружено вакансий из API: {len(jobs)}")
    
    with open('jobs_supabase.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([f[0] for f in FIELDS])
        
        filled_count = 0
        for job in jobs:
            row = [get_value(job, f[1], org_map=org_map) for f in FIELDS]
            
            # Преобразуем даты в ISO, если есть
            for i, field in enumerate([f[0] for f in FIELDS]):
                if field in ('created_at', 'updated_at') and row[i]:
                    try:
                        row[i] = datetime.fromisoformat(row[i]).isoformat()
                    except Exception:
                        pass
            
            writer.writerow(row)
            
            # Статистика по заполненным полям
            if row[6] or row[7] or row[8] or row[9]:  # description, requirements, responsibilities, conditions
                filled_count += 1
        
        print(f"✅ Создан jobs_supabase.csv")
        print(f"📊 Вакансий с заполненными полями: {filled_count} из {len(jobs)}")

if __name__ == '__main__':
    main()
