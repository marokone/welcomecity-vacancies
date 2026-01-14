import pandas as pd
import csv

# Чтение исходного файла
input_path = 'jobs_supabase.csv'
output_path = 'vacancies_rows.csv'

# Загрузка данных
src = pd.read_csv(input_path, dtype=str)

# Формируем итоговый DataFrame с нужными столбцами и порядком
result = pd.DataFrame({
    'id': range(1, len(src) + 1),
    'title': src['title'],
    'project': '',
    'department': '',
    'description': src['description'],
    'requirements': src['requirements'],
    'responsibilities': src['responsibilities'],
    'conditions': src['conditions'],
    'format': '',
    'status': '',
    'created_at': src['created_at'],
    'updated_at': src['updated_at'],
    'job_id': src['job_id'],
    'jobtype_id': src['jobtype_id'],
    'jobtype_name': src['jobtype_name'],
})

# Сохраняем с BOM для Excel
result.to_csv(output_path, index=False, encoding='utf-8-sig', quoting=csv.QUOTE_NONNUMERIC)
print('Готово: vacancies_rows.csv')
