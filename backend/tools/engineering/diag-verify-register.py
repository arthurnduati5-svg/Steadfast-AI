import re, os, json
BASE = r'C:\Users\HP\AppData\Local\Temp\steadfast-backend-intelligence-d9eb861'
text = open(os.path.join(BASE, 'backend/docs/engineering/06_BACKEND_ALGORITHM_REGISTER.md'), encoding='utf-8').read()
parts = re.split(r'^### (ALG-\S+)', text, flags=re.M)
rows = []
for i in range(1, len(parts), 2):
    aid = parts[i]; body = parts[i+1]
    m = re.search(r'path:\s*`([^`]+)`', body)
    sym = re.search(r'symbol:\s*`([^`]+)`', body)
    p = m.group(1) if m else 'NO-PATH'
    full = os.path.join(BASE, 'backend', p)
    exists = os.path.exists(full) if p != 'NO-PATH' else False
    rows.append({'id': aid, 'path': p, 'exists': exists, 'symbol': sym.group(1) if sym else ''})
    print(('OK      ' if exists else 'MISSING ') + aid + ' -> ' + p)
print('total:', len(rows), 'ok:', sum(1 for r in rows if r['exists']))
