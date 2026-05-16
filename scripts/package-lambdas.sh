#!/usr/bin/env bash

set -euo pipefail

mkdir -p artifacts

rm -f artifacts/workshop-edge-auth-cpf.zip artifacts/workshop-edge-notify.zip
rm -rf artifacts/package-auth-cpf artifacts/package-notify

mkdir -p artifacts/package-auth-cpf artifacts/package-notify

cp dist/auth-cpf.js artifacts/package-auth-cpf/auth-cpf.js
cp dist/notify.js artifacts/package-notify/notify.js

printf '{\n  "type": "module"\n}\n' > artifacts/package-auth-cpf/package.json
printf '{\n  "type": "module"\n}\n' > artifacts/package-notify/package.json

(
  cd artifacts/package-auth-cpf
  python3 -m zipfile -c ../workshop-edge-auth-cpf.zip auth-cpf.js package.json
)

(
  cd artifacts/package-notify
  python3 -m zipfile -c ../workshop-edge-notify.zip notify.js package.json
)

rm -rf artifacts/package-auth-cpf artifacts/package-notify

echo "Artifacts generated in artifacts/"
