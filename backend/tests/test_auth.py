import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app import app  # noqa: E402


def post(client, body):
    return client.post('/keyring/api/auth', json=body)


class AuthTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        os.environ['KEYRING_CREDENTIAL'] = 'me@example.com:s3cret:with:colons'

    def test_valid(self):
        r = post(self.client, {'id': 'me@example.com', 'password': 's3cret:with:colons'})
        self.assertEqual(r.status_code, 200)

    def test_wrong_password(self):
        self.assertEqual(post(self.client, {'id': 'me@example.com', 'password': 'x'}).status_code, 401)

    def test_non_ascii_and_non_string_do_not_500(self):
        self.assertEqual(post(self.client, {'id': 'mé', 'password': 'é'}).status_code, 401)
        self.assertEqual(post(self.client, {'id': 1, 'password': None}).status_code, 401)
        self.assertEqual(post(self.client, [1, 2]).status_code, 401)

    def test_empty_body(self):
        self.assertEqual(self.client.post('/keyring/api/auth').status_code, 401)

    def test_unset_or_placeholder_credential_rejected(self):
        os.environ['KEYRING_CREDENTIAL'] = ''
        self.assertEqual(post(self.client, {'id': '', 'password': ''}).status_code, 500)
        os.environ['KEYRING_CREDENTIAL'] = 'you@email.com:changeme'
        r = post(self.client, {'id': 'you@email.com', 'password': 'changeme'})
        self.assertEqual(r.status_code, 500)

    def test_health(self):
        self.assertEqual(self.client.get('/keyring/api/health').status_code, 200)


if __name__ == '__main__':
    unittest.main()
