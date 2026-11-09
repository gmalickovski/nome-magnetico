param([ValidateSet('teste','producao')][string]$Environment='teste')
$ErrorActionPreference='Stop'
$savedToken=$env:OP_SERVICE_ACCOUNT_TOKEN
$savedBiometric=$env:OP_BIOMETRIC_UNLOCK_ENABLED
Remove-Item Env:OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
$env:OP_BIOMETRIC_UNLOCK_ENABLED='true'
$stage='vault'
try {
 $ref=if($Environment -eq 'teste'){'kbqrkkltjvmxomrgsrbc'}else{'bhxneaeuhybtucmbmpvg'}
 $vault=if($Environment -eq 'teste'){'Studio MLK - TESTE'}else{'Studio MLK'}
 $title=if($Environment -eq 'teste'){'NM-TESTE-Alertas Postgres Leitura'}else{'NM-OPS-Alertas Postgres Leitura'}
 $credentialId=if($Environment -eq 'teste'){'NmAlertsTest24801'}else{'NmAlertsProd24801'}
 $credentialName=if($Environment -eq 'teste'){'[NM] Supabase Alertas TESTE (readonly)'}else{'[NM] Supabase Alertas PRODUCAO (readonly)'}
 $items=op item list --vault $vault --format=json | ConvertFrom-Json
 if($LASTEXITCODE -ne 0){throw 'metadata'}
 $existing=@($items | Where-Object title -eq $title)
 if($existing.Count -gt 1){throw 'ambiguous'}
 if($existing.Count -eq 0){
   $created=op item create --category=login --vault $vault --title $title --generate-password=letters,digits,64 --format=json | ConvertFrom-Json
   if($LASTEXITCODE -ne 0){throw 'create'}
   $itemId=$created.id
 } else { $itemId=$existing[0].id }
 $secretItem=op item get $itemId --vault $vault --format=json | ConvertFrom-Json
 if($LASTEXITCODE -ne 0){throw 'read'}
 $password=($secretItem.fields | Where-Object id -eq 'password').value
 if($password -cnotmatch '^[a-zA-Z0-9]{64}$'){throw 'format'}
 $management=op item get sn527u2c2khm622vzby7mpgk5i --vault 'Studio MLK' --format=json | ConvertFrom-Json
 if($LASTEXITCODE -ne 0){throw 'management'}
 $pat=($management.fields | Where-Object id -eq 'SUPABASE_ACCESS_TOKEN').value
 if(-not $pat){throw 'token'}
 $headers=@{Authorization=('Bearer '+$pat)}
 $stage='role'
 # Alphanumeric generated password: runtime only, never argv or local file.
 $query="ALTER ROLE nm_alerts_reader LOGIN PASSWORD '$password';"
 $body=@{query=$query} | ConvertTo-Json -Compress
 $null=Invoke-RestMethod -Method Post -Uri ("https://api.supabase.com/v1/projects/"+$ref+"/database/query") -Headers $headers -ContentType 'application/json' -Body $body
 $connection=@{host='aws-1-sa-east-1.pooler.supabase.com';port=6543;database='postgres';user=("nm_alerts_reader."+$ref);password=$password}
 $probeBase64=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('const {Client}=require(''pg'');let raw='''';process.stdin.on(''data'',b=>raw+=b);process.stdin.on(''end'',async()=>{let c;try{c=new Client({...JSON.parse(raw),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});await c.connect();const r=await c.query("select current_setting(''default_transaction_read_only'') as ro,current_setting(''statement_timeout'') as timeout");if(r.rows[0].ro!==''on''||r.rows[0].timeout!==''15s'')throw Error(''settings'');await c.query(''select count(*) from nm_ops_alerts.incidents'');for(const sql of [''select email from public.profiles limit 1'',''delete from public.subscriptions where false'']){let denied=false;try{await c.query(sql)}catch(e){denied=[''42501'',''25006''].includes(e.code)}if(!denied)throw Error(''permission'')}console.log(''Restricted TLS login, read and deny checks passed'');}catch(e){console.log(''Restricted connection check failed: ''+(e.code||''validation''));process.exitCode=1;}finally{if(c)await c.end()}});'))
 $probeCommand='docker exec -i -e NODE_EXTRA_CA_CERTS=/home/node/.n8n/certs/dev248-supabase-ca.crt -e NODE_TLS_REJECT_UNAUTHORIZED=1 -w /usr/local/lib/node_modules/n8n n8n node -e ''eval(Buffer.from("'+$probeBase64+'","base64").toString())'''
 $stage='TLS probe'
 $connection | ConvertTo-Json -Compress | ssh -o BatchMode=yes -o ForwardAgent=no -o ConnectTimeout=10 -p 2222 root@103.199.185.152 $probeCommand
 if($LASTEXITCODE -ne 0){throw 'probe'}
 $data=@{host=$connection.host;port=6543;database='postgres';user=$connection.user;password=$password;ssl='require';allowUnauthorizedCerts=$false;sshTunnel=$false}
 $credential=@(@{id=$credentialId;name=$credentialName;type='postgres';data=$data})
 $stage='n8n import'
 $importCommand='docker exec -i -u node n8n sh -c ''umask 077; credential_file=$(mktemp /tmp/dev248-credential.XXXXXX); trap "rm -f -- $credential_file" EXIT; cat > "$credential_file"; n8n import:credentials --input="$credential_file" --projectId=mo32tEzhFsL9E0Rl >/dev/null'''
 ConvertTo-Json -InputObject $credential -Depth 6 -Compress | ssh -o BatchMode=yes -o ForwardAgent=no -o ConnectTimeout=10 -p 2222 root@103.199.185.152 $importCommand
 if($LASTEXITCODE -ne 0){throw 'import'}
 Write-Output ("Provisioned "+$Environment+"; vault item "+$itemId+"; n8n credential "+$credentialId)
} catch {
 # Never print HTTP exceptions that can contain request bodies.
 Write-Output ("Credential provisioning stopped at "+$stage+"; no secret output.")
 exit 1
} finally {
 $env:OP_SERVICE_ACCOUNT_TOKEN=$savedToken
 $env:OP_BIOMETRIC_UNLOCK_ENABLED=$savedBiometric
}
