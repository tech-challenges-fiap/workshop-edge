#!/usr/bin/env bash

set -euo pipefail

mkdir -p artifacts

rm -f artifacts/workshop-edge-auth-cpf.zip artifacts/workshop-edge-notify.zip

python3 -m zipfile -c artifacts/workshop-edge-auth-cpf.zip dist/auth-cpf.js
python3 -m zipfile -c artifacts/workshop-edge-notify.zip dist/notify.js

echo "Artifacts generated in artifacts/"
