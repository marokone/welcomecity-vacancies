
import math
import pandas as pd
import requests
from datetime import datetime, timezone

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

# pandas 3.0 убрал applymap для DataFrame; маппим по колонкам
df = df.astype(object).apply(lambda col: col.map(_clean))

headers = {
    'apikey': SUPABASE_API_KEY,
    'Authorization': f'Bearer {SUPABASE_API_KEY}',
    'Content-Type': 'application/json',
    # upsert: если запись с таким уникальным ключом есть, она будет перезаписана
    'Prefer': 'resolution=merge-duplicates,return-minimal'
}

# Берём существующие job_id, чтобы не трогать старые записи
existing_resp = requests.get(
    f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=job_id",
    headers=headers,
)
existing_resp.raise_for_status()
existing_ids = {str(item.get('job_id')) for item in existing_resp.json() if item.get('job_id') is not None}
print(f'DEBUG: существующих job_id в Supabase: {len(existing_ids)}')
print(f'DEBUG: примеры: {sorted(list(existing_ids))[-5:]}')

# Оставляем только новые вакансии
df['job_id'] = df['job_id'].astype(str)
print(f'DEBUG: всего job_id в CSV: {len(df)}')
print(f'DEBUG: примеры CSV: {sorted(df["job_id"].unique())[-5:]}')

df_new = df[~df['job_id'].isin(existing_ids)].copy()
print(f'DEBUG: новых job_id (не в Supabase): {len(df_new)}')

# Дополнительная нормализация после фильтра: гарантируем отсутствие NaN
df_new = df_new.where(pd.notna(df_new), None)

if df_new.empty:
    print('Новых вакансий нет, загрузка пропущена')
    exit(0)

# Массовая вставка (bulk insert) только новых записей

# Дополнительная очистка на всякий случай перед сериализацией в JSON
def _clean_record(rec: dict) -> dict:
    return {k: _clean(v) for k, v in rec.items()}

data = [_clean_record(rec) for rec in df_new.to_dict(orient='records')]

for row in data:
    now_iso = datetime.now(timezone.utc).isoformat()
    if not row.get('updated_at') or str(row.get('updated_at')).strip() == '' or str(row.get('updated_at')).lower() == 'none':
        row['updated_at'] = now_iso
    if not row.get('created_at') or str(row.get('created_at')).strip() == '' or str(row.get('created_at')).lower() == 'none':
        row['created_at'] = now_iso
    if not row.get('status') or str(row.get('status')).strip() == '' or str(row.get('status')).lower() == 'none':
        row['status'] = 'active'

# Вставляем по одной записи, пропуская дубликаты
success_count = 0
for i, row in enumerate(data, 1):
    print(f'DEBUG: отправляю запись {i}/{len(data)}, job_id = {row.get("job_id")}')
    response = requests.post(
        f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}',
        headers=headers,
        json=[row]  # Отправляем массив из одного элемента
    )
    if not response.ok:
        if 'already exists' in response.text or '23505' in response.text:
            print(f'  Пропущено (дубликат): job_id {row.get("job_id")}')
        else:
            print(f'  Ошибка: {response.text}')
    else:
        success_count += 1
        print(f'  Вставлено')

print(f'Импорт завершён. Успешно вставлено: {success_count} из {len(data)}')
