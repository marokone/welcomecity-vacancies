import pandas as pd
import csv

# Чтение исходного файла
input_path = 'jobs_supabase.csv'
output_path = 'vacancies_rows.csv'

# Загрузка данных
src = pd.read_csv(input_path, dtype=str)

# Формируем итоговый DataFrame с нужными столбцами и порядком
# ⚠️ НЕ генерируем id, оставляем как есть (из FriendWork)
result = pd.DataFrame({
    'id': src['job_id'],  # используем job_id как id
    'title': src['title'],
    'project': src['project'],
    'department': src['department'],
    'description': src['description'],
    'requirements': src['requirements'],
    'responsibilities': src['responsibilities'],
    'conditions': src['conditions'],
    'format': '',  # если нужно заполнить - добавь логику
    'status': src['status'],  # берем из исходных данных
    'created_at': src['created_at'],
    'updated_at': src['updated_at'],
    'job_id': src['job_id'],
    'jobtype_id': src['jobtype_id'],
    'jobtype_name': src['jobtype_name'],
})

# Сохраняем с BOM для Excel
result.to_csv(output_path, index=False, encoding='utf-8-sig', quoting=csv.QUOTE_NONNUMERIC)
print('✅ Готово: vacancies_rows.csv')
print(f'📊 Обработано записей: {len(src)}')
print('📁 Поля в файле:', ', '.join(result.columns.tolist()))
