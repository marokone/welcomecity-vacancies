import math
import pandas as pd
import requests
from datetime import datetime, timezone

SUPABASE_URL = 'https://vhbiezamhpyejdqvvwuj.supabase.co'
SUPABASE_API_KEY = 'sb_publishable_PEUJVHuw56T2d3vA2iVMZA_POiY0MCX'
TABLE_NAME = 'vacancies_fw'

# Поля, которые могут быть заполнены вручную в Тильде
MANUAL_FIELDS = ['description', 'requirements', 'responsibilities', 'conditions']

def _clean(v):
    """Очистка значений: NaN/Inf/None/пустые строки -> None"""
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

def is_field_empty(value):
    """Проверяет, пустое ли поле (None, NaN, пустая строка)"""
    cleaned = _clean(value)
    return cleaned is None or cleaned == ''

# Загрузка данных из CSV
csv_path = 'vacancies_rows.csv'
df_new = pd.read_csv(csv_path, dtype=str)
print(f'📥 Загружено записей из CSV: {len(df_new)}')

# Нормализация новых данных
df_new = df_new.astype(object).apply(lambda col: col.map(_clean))

headers = {
    'apikey': SUPABASE_API_KEY,
    'Authorization': f'Bearer {SUPABASE_API_KEY}',
    'Content-Type': 'application/json',
}

# Получаем все существующие записи из Supabase
print('🔍 Получаем текущие данные из Supabase...')
existing_resp = requests.get(
    f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=*",
    headers=headers,
)
existing_resp.raise_for_status()
existing_data = existing_resp.json()
print(f'📊 Найдено записей в Supabase: {len(existing_data)}')

# Создаем словарь существующих записей по job_id
existing_map = {str(item['job_id']): item for item in existing_data if item.get('job_id')}

# Подготавливаем данные для обновления
records_to_upsert = []

for _, row in df_new.iterrows():
    record = row.to_dict()
    job_id = str(record.get('job_id'))
    
    # Если запись уже существует в Supabase
    if job_id in existing_map:
        existing = existing_map[job_id]
        
        # Для каждого поля проверяем: если новое значение пустое, оставляем существующее
        for field in MANUAL_FIELDS:
            if is_field_empty(record.get(field)):
                # Если в новых данных поле пустое, оставляем то, что уже есть в БД
                record[field] = existing.get(field)
                print(f'  🔄 Поле {field} для job_id {job_id}: оставляем существующее значение')
            else:
                print(f'  ✨ Поле {field} для job_id {job_id}: обновляем из френдворка')
        
        # Обновляем даты
        now_iso = datetime.now(timezone.utc).isoformat()
        record['updated_at'] = now_iso
        
        # Сохраняем оригинальную дату создания, если она была
        if not is_field_empty(record.get('created_at')):
            record['created_at'] = existing.get('created_at', record.get('created_at'))
    
    records_to_upsert.append(record)

print(f'\n📦 Подготовлено записей для upsert: {len(records_to_upsert)}')

if not records_to_upsert:
    print('❌ Нет данных для загрузки')
    exit(0)

# Настройки для upsert
upsert_headers = headers.copy()
upsert_headers['Prefer'] = 'resolution=merge-duplicates,return-minimal'

# Отправляем данные
print('🚀 Отправляем данные в Supabase...')
response = requests.post(
    f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}',
    headers=upsert_headers,
    json=records_to_upsert
)

if response.ok:
    print(f'✅ Успешно загружено/обновлено {len(records_to_upsert)} записей')
else:
    print(f'❌ Ошибка: {response.status_code}')
    print(response.text)
    
    # Если массовая не сработала, пробуем по одной для отладки
    print('\n🔧 DEBUG: пробую по одной записи:')
    success_count = 0
    for i, record in enumerate(records_to_upsert, 1):
        print(f'  Запись {i}, job_id = {record.get("job_id")}')
        resp = requests.post(
            f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}',
            headers=upsert_headers,
            json=[record]
        )
        if resp.ok:
            success_count += 1
            print(f'    ✅ Успешно')
        else:
            print(f'    ❌ Ошибка: {resp.text}')
    
    print(f'\n📊 Итог: {success_count} из {len(records_to_upsert)} записей загружено')
