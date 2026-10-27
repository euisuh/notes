import hmac
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# Value shipped in .env.example / docker-compose.yml; must never authenticate.
PLACEHOLDER = 'you@email.com:changeme'


def _same(supplied, stored):
    return isinstance(supplied, str) and hmac.compare_digest(
        supplied.encode(), stored.encode())


@app.route('/keyring/api/auth', methods=['POST'])
def auth():
    credential = os.environ.get('KEYRING_CREDENTIAL', '')
    parts = credential.split(':', 1)
    if len(parts) != 2 or not parts[0]:
        return jsonify({'error': 'Server misconfigured'}), 500

    stored_id, stored_pw = parts
    if credential == PLACEHOLDER:
        return jsonify({'error': 'Server misconfigured'}), 500

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}
    # compare_digest: constant-time; encode so non-ASCII input can't raise TypeError.
    id_ok = _same(data.get('id'), stored_id)
    pw_ok = _same(data.get('password'), stored_pw)
    if id_ok and pw_ok:
        return jsonify({'ok': True}), 200
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/keyring/api/health')
def health():
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
