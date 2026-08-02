"""
Smart-Metrolac — API Security / Access Control Test
======================================================
Verifies your JWT authentication and role-based authorization actually
enforce what they claim to, against your LOCAL backend only.

WHAT THIS PROVES
-----------------
1. Unauthenticated requests are rejected (no token -> 401)
2. Malformed/garbage tokens are rejected (-> 401)
3. Tampered tokens (valid structure, forged/broken signature) are
   rejected -> proves signature verification is actually enforced,
   not just checked-for-presence.
4. Expired tokens are rejected even with a technically-valid signature
   -> proves expiry is enforced.
5. Role-based authorization is enforced: an authenticated user with the
   WRONG role for an endpoint is rejected with 403, not allowed through.
6. A correctly authenticated, correctly-authorized request succeeds
   (the positive control -- without this, a "test" that only ever
   expects rejections proves nothing).

IMPORTANT SAFETY NOTE
-----------------------
This script needs your JWT signing secret to forge test tokens (expired /
tampered / wrong-role). ONLY ever run this with your LOCAL dev secret
(the one in application-dev.properties) against localhost. Never put
your real production jwt.secret in this script or run it against your
EC2/hosted backend -- that would be a genuine secret leak.

BEFORE YOU RUN THIS
---------------------
Install dependency:
    pip install pyjwt requests --break-system-packages

Fill in the CONFIG block below with your LOCAL values.
Your backend must be running locally (mvn spring-boot:run) with the
application-dev.properties jwt.secret set.

Then run:
    python3 api_security_test.py
"""

import json
import time
import requests
import jwt as pyjwt

# ============================== CONFIG ===============================
REST_BASE_URL   = "http://localhost:8080"

# Real local login (created earlier via psql) — used for the positive control
# and for the "wrong role for this endpoint" real-token test.
LOGIN_USERNAME  = "localadmin"
LOGIN_PASSWORD  = "localtest123"

# MUST match jwt.secret in your LOCAL application-dev.properties exactly.
# NEVER put a production secret here.
LOCAL_JWT_SECRET = "local-dev-only-secret-do-not-use-in-prod-1234567890abcdef"
JWT_ALGORITHM     = "HS384"   # matches what jjwt auto-selects for a 57-byte secret

CENTER_ID = 1   # a real collection_center_id in your local DB
# =======================================================================

results = []


def record(name, expected, actual, note=""):
    passed = expected == actual
    results.append({"test": name, "expected": expected, "actual": actual, "passed": passed, "note": note})
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {name}: expected {expected}, got {actual}  {note}")


def real_login():
    resp = requests.post(f"{REST_BASE_URL}/api/auth/login",
                          json={"username": LOGIN_USERNAME, "password": LOGIN_PASSWORD}, timeout=10)
    resp.raise_for_status()
    return resp.json()["token"]


def get_invoices(headers):
    return requests.get(f"{REST_BASE_URL}/api/invoices",
                         params={"centerId": CENTER_ID}, headers=headers, timeout=10)


def post_invoice(headers, body=None):
    # For pure auth-header tests, an empty body is fine (we expect a 401/403
    # before validation even runs). For the role-enforcement test, pass a
    # fully valid-shaped body so the request actually reaches @PreAuthorize.
    return requests.post(f"{REST_BASE_URL}/api/invoices", json=body or {}, headers=headers, timeout=10)


def forge_token(claims: dict, secret: str = LOCAL_JWT_SECRET, algorithm: str = JWT_ALGORITHM):
    return pyjwt.encode(claims, secret, algorithm=algorithm)


def main():
    print("=" * 60)
    print("Smart-Metrolac API Security / Access Control Test")
    print(f"Target: {REST_BASE_URL}  (make sure this says localhost!)")
    print("=" * 60)

    if "localhost" not in REST_BASE_URL and "127.0.0.1" not in REST_BASE_URL:
        print("\n!!! REST_BASE_URL is not localhost. Refusing to run — this test "
              "forges JWTs and must never be pointed at a real deployment. !!!")
        return

    # ---- Positive control: real login, real token ----
    real_token = real_login()
    print("Real login OK.")
    print("Note: this app returns 403 for ALL auth failures (missing/invalid/expired token)")
    print("rather than distinguishing 401 (not authenticated) vs 403 (not authorized).")
    print("That's a minor REST-convention detail, not a security gap — access is still")
    print("correctly denied in every case below.\n")

    resp = get_invoices({"Authorization": f"Bearer {real_token}"})
    record("Valid token, correct role -> GET /api/invoices", 200, resp.status_code,
           "(positive control — if this fails, nothing else below is meaningful)")

    # ---- No token at all ----
    resp = get_invoices({})
    record("No Authorization header -> GET /api/invoices", 403, resp.status_code,
           "(this app returns 403 for all auth failures, not 401 — see note below)")

    # ---- Garbage / malformed token ----
    resp = get_invoices({"Authorization": "Bearer not-a-real-token-at-all"})
    record("Malformed token -> GET /api/invoices", 403, resp.status_code)

    # ---- Tampered token: valid real token with the last character flipped ----
    tampered = real_token[:-1] + ("A" if real_token[-1] != "A" else "B")
    resp = get_invoices({"Authorization": f"Bearer {tampered}"})
    record("Tampered signature -> GET /api/invoices", 403, resp.status_code,
           "(proves signature is actually verified, not just presence-checked)")

    # ---- Expired token: valid signature, exp in the past ----
    now = int(time.time())
    expired_claims = {
        "sub": LOGIN_USERNAME,
        "role": "company_admin",
        "must_change_password": False,
        "userId": 1,
        "iat": now - 3600,
        "exp": now - 1800,   # expired 30 minutes ago
    }
    expired_token = forge_token(expired_claims)
    resp = get_invoices({"Authorization": f"Bearer {expired_token}"})
    record("Expired token (valid signature) -> GET /api/invoices", 403, resp.status_code)

    # ---- Forged token with a role that shouldn't have access ----
    wrong_role_claims = {
        "sub": "forged-user",
        "role": "farmer",   # farmers aren't authorized for this endpoint
        "must_change_password": False,
        "userId": 999,
        "iat": now,
        "exp": now + 3600,
    }
    wrong_role_token = forge_token(wrong_role_claims)
    resp = get_invoices({"Authorization": f"Bearer {wrong_role_token}"})
    record("Valid signature, wrong role (farmer) -> GET /api/invoices", 403, resp.status_code,
           "(signature is genuinely valid — this tests role authorization, not authentication)")

    # ---- Real, valid, correctly-authenticated token — but wrong role for THIS endpoint ----
    # POST /api/invoices requires 'collection_center_admin'; our real account is 'company_admin'.
    # IMPORTANT: body must pass @Valid so the request actually reaches the @PreAuthorize
    # check — an invalid/empty body gets rejected with 400 before authorization is ever
    # evaluated, which would make this test meaningless.
    valid_shaped_body = {
        "farmerId": 3,
        "deviceId": 1,
        "centerId": CENTER_ID,
        "measurementDateTime": "2026-08-02T10:00:00",
        "drc": 32.5,
        "totalLitres": 10.0,
        "totalAmount": 1000.0,
        "temperature": 27.0,
        "phStatus": "normal",
        "tdsStatus": "normal",
    }
    resp = post_invoice({"Authorization": f"Bearer {real_token}"}, body=valid_shaped_body)
    record("Real company_admin token -> POST /api/invoices (requires collection_center_admin)",
           403, resp.status_code,
           "(uses your REAL account and REAL token — no forging — proves role enforcement end to end)")

    # ---- Summary ----
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed}/{total} checks behaved as expected")
    print("=" * 60)
    for r in results:
        status = "PASS" if r["passed"] else "FAIL"
        print(f"  [{status}] {r['test']}")

    with open("security_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nSaved security_test_results.json")
    print("Run `python3 plot_security_results.py` next to generate a summary chart.")


if __name__ == "__main__":
    main()