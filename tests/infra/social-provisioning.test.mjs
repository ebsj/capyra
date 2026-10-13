import test from "node:test";
import assert from "node:assert/strict";
import { buildProvisionSql } from "../../tools/provision-social.mjs";
const ids = {"account-id":"00000000-0000-4000-8000-000000000001","idempotency-key":"00000000-0000-4000-8000-000000000002"};
test("manual provisioning validates quantities and quotes operator reason as SQL data",()=>{
  const sql=buildProvisionSql({...ids,"analysis-packs":"1",reason:"Operator's pilot"},"2026-09-14T00:00:00Z");
  assert.match(sql,/Operator''s pilot/);assert.match(sql,/INSERT OR IGNORE/);
  assert.throws(()=>buildProvisionSql({...ids,"add-brands":"-1",reason:"test"}),/integer/);
  assert.throws(()=>buildProvisionSql({...ids,"add-brands":"2; DROP TABLE brands",reason:"test"}),/integer/);
  assert.throws(()=>buildProvisionSql({...ids,"analysis-packs":"1",subscription:"unlimited",reason:"test"}),/subscription/);
});

test("provisioning grants once, rejects mismatched replay and rolls back invalid account", async()=>{
  const {execFileSync}=await import("node:child_process");
  const {fileURLToPath}=await import("node:url");
  const sql=buildProvisionSql({...ids,"add-brands":"2","analysis-packs":"1",reason:"pilot"},"2026-09-14T00:00:00Z");
  const script=`import sqlite3, pathlib, sys
root=pathlib.Path(sys.argv[1]); db=sqlite3.connect(':memory:')
for f in sorted((root/'apps/api/migrations').glob('*.sql')): db.executescript(f.read_text())
a='00000000-0000-4000-8000-000000000001'
db.execute("INSERT INTO accounts VALUES(?, 'Pilot', 'agency', '2026-09-14', '2026-09-14')",(a,))
db.execute("INSERT INTO account_entitlements(account_id,cycle_anchor) VALUES(?, '2026-09-14T00:00:00Z')",(a,))
statement=sys.argv[2]
db.executescript(statement);db.executescript(statement)
assert db.execute('SELECT brand_limit,identity_limit FROM account_entitlements').fetchone()==(7,21)
assert db.execute('SELECT SUM(remaining) FROM credit_lots').fetchone()[0]==50
assert db.execute('SELECT COUNT(*) FROM audit_events').fetchone()[0]==1
assert db.execute("SELECT id FROM audit_events WHERE id < 'ffffffff-ffff-ffff-ffff-ffffffffffff'").fetchone()[0]=='00000000-0000-4000-8000-000000000002'
try: db.executescript(statement.replace("'pilot'", "'changed'"));raise AssertionError('mismatch accepted')
except sqlite3.IntegrityError as e: assert 'idempotency_conflict' in str(e)
assert db.execute('SELECT COUNT(*) FROM social_provisioning_operations').fetchone()[0]==1
try: db.executescript(statement.replace(a,'00000000-0000-4000-8000-000000000003').replace('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004'));raise AssertionError('missing account accepted')
except sqlite3.IntegrityError: pass
assert db.execute('SELECT COUNT(*) FROM social_provisioning_operations').fetchone()[0]==1
assert db.execute('SELECT SUM(remaining) FROM credit_lots').fetchone()[0]==50
print('atomic provision and replay passed')`;
  const output=execFileSync("python3",["-c",script,fileURLToPath(new URL("../../",import.meta.url)),sql],{encoding:"utf8"});
  assert.match(output,/atomic provision and replay passed/);
});
