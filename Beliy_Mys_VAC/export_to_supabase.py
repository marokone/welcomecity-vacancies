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
    ('description', lambda j: j.get('description_structured', {}).get('описание', '')),
    ('requirements', lambda j: j.get('description_structured', {}).get('требования', '')),
    ('responsibilities', lambda j: j.get('description_structured', {}).get('обязанности', '')),
    ('conditions', lambda j: j.get('description_structured', {}).get('условия', '')),
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

# --- Новая функция для поиска project и department ---
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

    with open('jobs_structured.json', encoding='utf-8') as f:
        jobs = json.load(f)
    with open('jobs_supabase.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([f[0] for f in FIELDS])
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

if __name__ == '__main__':
    main()
