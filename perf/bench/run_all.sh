#!/usr/bin/env bash
# 用法：perf/bench/run_all.sh <A 地址> [B 地址] <输出目录> [次数]
# 只给 A 时单版本测；给了 B 时 A、B 交替配对测。口径：fast4g、冷缓存、1440x900。
set -euo pipefail
cd "$(dirname "$0")"
A=$1; shift
B=""; if [[ $# -ge 2 && $1 == http* ]]; then B=$1; shift; fi
OUT=$1; RUNS=${2:-10}
mkdir -p "$OUT"
for page in $(python3 -c "import json; print(' '.join(json.load(open('pages.json'))))"); do
  python3 - "$page" "$A" "$B" "$OUT" "$RUNS" <<'PY'
import json, subprocess, sys
page, A, B, out, runs = sys.argv[1:]
p = json.load(open('pages.json'))[page]
cmd = ['python3', 'bench.py', '--url', A.rstrip('/') + p['path'], '--ready', p['ready'],
       '--runs', runs, '--profile', 'fast4g', '--out', f'{out}/{page}.json']
if B: cmd += ['--url-b', B.rstrip('/') + p['path']]
if p.get('type_check'): cmd += ['--type-check', p['type_check']]
print(f'== {page}', flush=True)
subprocess.run(cmd, check=True)
PY
done
