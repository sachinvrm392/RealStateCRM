import urllib.request
import json
import time

token = 'vcp_16OovMbkeCgcEefgOyaqCc3cVNKxjgDuPVVvpn8YXrLXGQWwa127tnPV'
team_id = 'team_S67Hpwxlg0fTsFT4JBHaLoau'
proj_id = 'prj_ORasicvjr96tiBKYuaLa6LSklj2j'

payload = {
    "name": "real-state-crm",
    "project": proj_id,
    "gitSource": {
        "type": "github",
        "repo": "RealStateCRM",
        "repoId": 1364411980,
        "ref": "main"
    }
}

req = urllib.request.Request(
    f'https://api.vercel.com/v13/deployments?teamId={team_id}',
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        dep_id = data.get('id')
        print("Created Deployment:", dep_id, data.get('url'), data.get('readyState'))

        # Poll status
        for _ in range(30):
            time.sleep(5)
            check_req = urllib.request.Request(
                f'https://api.vercel.com/v13/deployments/{dep_id}?teamId={team_id}',
                headers={'Authorization': f'Bearer {token}'}
            )
            with urllib.request.urlopen(check_req) as c_resp:
                c_data = json.loads(c_resp.read().decode())
                state = c_data.get('readyState')
                print(f"Deployment state: {state}")
                if state in ['READY', 'ERROR', 'CANCELED']:
                    print("Final URL:", f"https://{c_data.get('url')}")
                    break
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode())
except Exception as e:
    print("Error:", e)
