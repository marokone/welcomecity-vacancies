import json
import csv
from datetime import datetime

# Какие поля нужны для Supabase
FIELDS = [
    ('job_id', 'jobId'),
    ('jobtype_id', lambda j: j.get('jobType', {}).get('id')),
    ('jobtype_name', lambda j: j.get('jobType', {}).get('name')),
    ('title', 'name'),
    ('description', lambda j: j.get('description_structured', {}).get('описание', '')),
    ('requirements', lambda j: j.get('description_structured', {}).get('требования', '')),
    ('responsibilities', lambda j: j.get('description_structured', {}).get('обязанности', '')),
    ('conditions', lambda j: j.get('description_structured', {}).get('условия', '')),
    ('created_at', 'dateCreated'),
    ('updated_at', 'dateUpdated'),
]

def get_value(job, key):
    if callable(key):
        return key(job)
    return job.get(key, '')

def main():
    with open('jobs_structured.json', encoding='utf-8') as f:
        jobs = json.load(f)
    with open('jobs_supabase.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([f[0] for f in FIELDS])
        for job in jobs:
            row = [get_value(job, f[1]) for f in FIELDS]
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
