
import math
import pandas as pd
import requests
from datetime import datetime

SUPABASE_URL = 'https://vhbiezamhpyejdqvvwuj.supabase.co'
SUPABASE_API_KEY = 'sb_publishable_PEUJVHuw56T2d3vA2iVMZA_POiY0MCX'
TABLE_NAME = 'vacancies_fw'

# Загрузка данных из CSV
csv_path = 'vacancies_rows.csv'
df = pd.read_csv(csv_path, dtype=str)

# Жёсткая нормализация значений: NaN/Inf/None/пустые строки -> None
def _clean(v):
    if v is None:
        return None
    if isinstance(v, float):
        if math.isnan(v) or math.isinf(v):
            return None
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    if isinstance(v, str):
        s = v.strip()
        if s == '' or s.lower() in ('nan', 'none', 'inf', '-inf'):
            return None
    return v

df = df.astype(object).applymap(_clean)

headers = {
    'apikey': SUPABASE_API_KEY,
    'Authorization': f'Bearer {SUPABASE_API_KEY}',
    'Content-Type': 'application/json',
    # upsert: если запись с таким уникальным ключом есть, она будет перезаписана
    'Prefer': 'resolution=merge-duplicates,return=minimal'
}

batch_size = 50  # Можно увеличить/уменьшить при необходимости
# Массовая вставка (bulk insert)
data = df.to_dict(orient='records')

# Заполняем пустые updated_at корректной датой
for row in data:
    if not row.get('updated_at') or str(row.get('updated_at')).strip() == '' or str(row.get('updated_at')).lower() == 'none':
        row['updated_at'] = datetime.utcnow().isoformat()

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
