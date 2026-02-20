import math
import pandas as pd
import requests
import json
from datetime import datetime, timezone

SUPABASE_URL = 'https://vhbiezamhpyejdqvvwuj.supabase.co'
SUPABASE_API_KEY = 'sb_publishable_PEUJVHuw56T2d3vA2iVMZA_POiY0MCX'
TABLE_NAME = 'vacancies_fw'

# Поля, которые могут быть заполнены вручную в Тильде
MANUAL_FIELDS = ['description', 'requirements', 'responsibilities', 'conditions']

def clean_value(v):
    """Очистка значений от NaN, Inf и прочего мусора"""
    if v is None:
        return None
    if isinstance(v, float):
        if math.isnan(v) or math.isinf(v):
            return None
    try:
        if pd.isna(v):
            return None
    except:
        pass
    if isinstance(v, str):
        s = v.strip()
        if s == '' or s.lower() in ('nan', 'none', 'inf', '-inf', 'null'):
            return None
    return v

def is_field_empty(value):
    """Проверяет, пустое ли поле"""
    cleaned = clean_value(value)
    return cleaned is None or cleaned == ''

# Загрузка данных из CSV
csv_path = 'vacancies_rows.csv'
df = pd.read_csv(csv_path, dtype=str)

print(f'📥 Загружено записей из CSV: {len(df)}')

# Глобальная очистка всех NaN
df = df.fillna(value='')
df = df.replace([math.nan, float('nan'), float('inf'), float('-inf')], '', regex=False)

# Конвертируем в список словарей и чистим каждое значение
records = []
for _, row in df.iterrows():
    record = {}
    for col in df.columns:
        record[col] = clean_value(row[col])
    records.append(record)

print(f'📦 Подготовлено записей: {len(records)}')

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

if existing_resp.status_code != 200:
    print(f'❌ Ошибка получения данных: {existing_resp.status_code}')
    print(existing_resp.text)
    exit(1)

existing_data = existing_resp.json()
print(f'📊 Найдено записей в Supabase: {len(existing_data)}')

# Создаем словарь существующих записей по job_id
existing_map = {str(item['job_id']): item for item in existing_data if item.get('job_id')}

# Подготавливаем данные для обновления
records_to_upsert = []

for record in records:
    job_id = str(record.get('job_id', ''))
    
    if not job_id:
        print('⚠️ Пропущена запись без job_id')
        continue
    
    # Если запись уже существует в Supabase
    if job_id in existing_map:
        existing = existing_map[job_id]
        
        # Для каждого поля проверяем: если новое значение пустое, оставляем существующее
        for field in MANUAL_FIELDS:
            if is_field_empty(record.get(field)):
                record[field] = existing.get(field)
                print(f'  🔄 Поле {field} для job_id {job_id}: оставляем существующее значение')
            else:
                print(f'  ✨ Поле {field} для job_id {job_id}: обновляем из френдворка')
        
        # Обновляем даты
        now_iso = datetime.now(timezone.utc).isoformat()
        record['updated_at'] = now_iso
        
        # Сохраняем оригинальную дату создания
        if is_field_empty(record.get('created_at')):
            record['created_at'] = existing.get('created_at', now_iso)
    else:
        # Новая запись
        now_iso = datetime.now(timezone.utc).isoformat()
        if is_field_empty(record.get('created_at')):
            record['created_at'] = now_iso
        if is_field_empty(record.get('updated_at')):
            record['updated_at'] = now_iso
        if is_field_empty(record.get('status')):
            record['status'] = 'active'
    
    # Финальная очистка от NaN перед отправкой
    cleaned_record = {}
    for k, v in record.items():
        cleaned_record[k] = clean_value(v)
    
    records_to_upsert.append(cleaned_record)

print(f'\n📦 Подготовлено записей для upsert: {len(records_to_upsert)}')

if not records_to_upsert:
    print('❌ Нет данных для загрузки')
    exit(0)

# Настройки для upsert
upsert_headers = headers.copy()
upsert_headers['Prefer'] = 'resolution=merge-duplicates,return-minimal'

# Отправляем данные
print('🚀 Отправляем данные в Supabase...')

try:
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
        
        # Если массовая не сработала, пробуем по одной
        print('\n🔍 Пробую по одной записи:')
        success_count = 0
        for i, record in enumerate(records_to_upsert, 1):
            print(f'  Запись {i}, job_id = {record.get("job_id")}')
            try:
                resp = requests.post(
                    f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}',
                    headers=upsert_headers,
                    json=[record]  # Отправляем как массив из одного элемента
                )
                if resp.ok:
                    success_count += 1
                    print(f'    ✅ Успешно')
                else:
                    print(f'    ❌ Ошибка: {resp.text}')
            except Exception as e:
                print(f'    ❌ Исключение: {e}')
        
        print(f'\n📊 Итог: {success_count} из {len(records_to_upsert)} записей загружено')
        
except Exception as e:
    print(f'❌ Критическая ошибка: {e}')
    
    # Сохраним проблемные данные для отладки
    with open('debug_failed_data.json', 'w', encoding='utf-8') as f:
        json.dump(records_to_upsert, f, indent=2, ensure_ascii=False, default=str)
    print('📁 Проблемные данные сохранены в debug_failed_data.json')
