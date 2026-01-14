
import pandas as pd
import requests
from datetime import datetime

SUPABASE_URL = 'https://vhbiezamhpyejdqvvwuj.supabase.co'
SUPABASE_API_KEY = 'sb_publishable_PEUJVHuw56T2d3vA2iVMZA_POiY0MCX'
TABLE_NAME = 'vacancies_fw'

# Загрузка данных из CSV
csv_path = 'vacancies_rows.csv'
df = pd.read_csv(csv_path, dtype=str)

headers = {
    'apikey': SUPABASE_API_KEY,
    'Authorization': f'Bearer {SUPABASE_API_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal,resolution=merge-duplicates'
}

batch_size = 50  # Можно увеличить/уменьшить при необходимости
# Массовая вставка (bulk insert)
data = df.where(pd.notnull(df), None).to_dict(orient='records')

# Заполняем пустые updated_at корректной датой
for row in data:
    if not row.get('updated_at') or str(row.get('updated_at')).strip() == '' or str(row.get('updated_at')).lower() == 'none':
        row['updated_at'] = datetime.utcnow().isoformat()

batch_size = 50  # Можно увеличить/уменьшить при необходимости
for i in range(0, len(data), batch_size):
    batch = data[i:i+batch_size]
    response = requests.post(
        f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}',
        headers=headers,
        json=batch
    )
    if not response.ok:
        print(f'Ошибка при вставке с {i+1} по {i+len(batch)}:', response.text)
    else:
        print(f'Вставлено строк: {len(batch)}')

print('Импорт завершён')
