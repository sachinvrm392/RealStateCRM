import urllib.request
import json
import time

token = 'vcp_16OovMbkeCgcEefgOyaqCc3cVNKxjgDuPVVvpn8YXrLXGQWwa127tnPV'
team_id = 'team_S67Hpwxlg0fTsFT4JBHaLoau'
proj_id = 'prj_ORasicvjr96tiBKYuaLa6LSklj2j'

url = f'https://api.vercel.com/v6/deployments?projectId={proj_id}&teamId={team_id}&limit=3'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        for d in data.get('deployments', []):
            uid = d.get('uid')
            state = d.get('state')
            durl = d.get('url')
            msg = d.get('meta', {}).get('githubCommitMessage', '')
            print(f"UID: {uid}, State: {state}, URL: https://{durl}, Commit: {msg}")
except Exception as e:
    print(f"Error: {e}")
