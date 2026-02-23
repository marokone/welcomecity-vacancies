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

def is_vacancy_complete(record):
    """Проверяет, заполнены ли все основные поля (не пустые)"""
    for field in MANUAL_FIELDS:
        if is_field_empty(record.get(field)):
            return False
    return True

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
records_to_update = []
records_to_insert = []

for record in records:
    job_id = str(record.get('job_id', ''))
    
    if not job_id:
        print('⚠️ Пропущена запись без job_id')
        continue
    
    # Определяем автоматический статус на основе заполненности
    auto_status = 'active' if is_vacancy_complete(record) else 'archived'
    
    # Если запись уже существует в Supabase
    if job_id in existing_map:
        existing = existing_map[job_id]
        
        # Создаем запись для обновления
        update_record = {}
        updated_fields = []
        
        # 1. Обновляем основные поля (только если они пустые в Supabase)
        for field in MANUAL_FIELDS:
            existing_value = existing.get(field)
            new_value = record.get(field)
            
            if is_field_empty(existing_value) and not is_field_empty(new_value):
                update_record[field] = new_value
                updated_fields.append(field)
                print(f'  ✨ Поле {field} для job_id {job_id}: заполняем пустое поле')
        
        # 2. Обновляем статус ТОЛЬКО если нет ручного статуса
        manual_status = existing.get('manual_status')
        if is_field_empty(manual_status):
            # Нет ручного статуса - используем автостатус
            if existing.get('status') != auto_status:
                update_record['status'] = auto_status
                updated_fields.append('status')
                print(f'  🔄 Автостатус для job_id {job_id}: -> {auto_status}')
        else:
            print(f'  🖐️ Ручной статус для job_id {job_id}: {manual_status} (не меняем)')
        
        # Если есть что обновлять
        if updated_fields:
            records_to_update.append({
                'job_id': job_id,
                'data': update_record,
                'fields': updated_fields
            })
            print(f'  ✅ Запись {job_id}: будут обновлены поля {", ".join(updated_fields)}')
        else:
            print(f'  ℹ️ Запись {job_id}: все поля уже актуальны')
    else:
        # Новая запись - добавляем целиком
        now_iso = datetime.now(timezone.utc).isoformat()
        if is_field_empty(record.get('created_at')):
            record['created_at'] = now_iso
        if is_field_empty(record.get('updated_at')):
            record['updated_at'] = now_iso
        
        # Для новых записей ставим автостатус
        record['status'] = auto_status
        # manual_status оставляем пустым
        
        records_to_insert.append(record)
        print(f'  🆕 Запись {job_id} будет добавлена как новая со статусом "{auto_status}"')

print(f'\n📊 Статистика:')
print(f'  - Будет обновлено: {len(records_to_update)} записей')
print(f'  - Будет добавлено новых: {len(records_to_insert)} записей')

# Обновляем существующие записи
print('\n🚀 Обновляем существующие записи...')
update_count = 0
for item in records_to_update:
    job_id = item['job_id']
    update_data = item['data']
    fields = item['fields']
    
    print(f'  Обновление job_id {job_id} (поля: {", ".join(fields)})...')
    try:
        resp = requests.patch(
            f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}?job_id=eq.{job_id}',
            headers=headers,
            json=update_data
        )
        
        if resp.ok:
            update_count += 1
            print(f'    ✅ Успешно обновлено')
        else:
            print(f'    ❌ Ошибка: {resp.status_code} - {resp.text}')
    except Exception as e:
        print(f'    ❌ Исключение: {e}')

# Добавляем новые записи
if records_to_insert:
    print(f'\n🚀 Добавляем новые записи...')
    insert_headers = headers.copy()
    insert_headers['Prefer'] = 'return-minimal'
    
    try:
        resp = requests.post(
            f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}',
            headers=insert_headers,
            json=records_to_insert
        )
        
        if resp.ok:
            print(f'  ✅ Успешно добавлено {len(records_to_insert)} новых записей')
        else:
            print(f'  ❌ Ошибка при добавлении: {resp.status_code} - {resp.text}')
            
            # Если массовое не сработало, добавляем по одной
            print('  🔍 Добавляем по одной...')
            insert_count = 0
            for record in records_to_insert:
                resp = requests.post(
                    f'{SUPABASE_URL}/rest/v1/{TABLE_NAME}',
                    headers=insert_headers,
                    json=[record]
                )
                if resp.ok:
                    insert_count += 1
                    print(f'    ✅ Добавлена вакансия {record.get("job_id")}')
                else:
                    print(f'    ❌ Ошибка при добавлении {record.get("job_id")}: {resp.text}')
            print(f'  ✅ Добавлено {insert_count} из {len(records_to_insert)}')
    except Exception as e:
        print(f'  ❌ Ошибка при массовом добавлении: {e}')
else:
    print('ℹ️ Нет новых записей для добавления')

print(f'\n📊 ИТОГ:')
print(f'  - Обновлено записей: {update_count} из {len(records_to_update)}')
print(f'  - Добавлено новых: {len(records_to_insert)}')
