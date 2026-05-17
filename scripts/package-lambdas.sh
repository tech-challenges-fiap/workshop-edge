#!/usr/bin/env bash

set -euo pipefail

mkdir -p artifacts

rm -f artifacts/workshop-edge-auth-cpf.zip artifacts/workshop-edge-notify.zip artifacts/workshop-edge-docs.zip
rm -rf artifacts/package-auth-cpf artifacts/package-notify artifacts/package-docs

mkdir -p artifacts/package-auth-cpf artifacts/package-notify artifacts/package-docs

cp dist/auth-cpf.js artifacts/package-auth-cpf/auth-cpf.js
cp dist/notify.js artifacts/package-notify/notify.js
cp dist/docs.js artifacts/package-docs/docs.js

printf '{\n  "type": "module"\n}\n' > artifacts/package-auth-cpf/package.json
printf '{\n  "type": "module"\n}\n' > artifacts/package-notify/package.json
printf '{\n  "type": "module"\n}\n' > artifacts/package-docs/package.json

(
  cd artifacts/package-auth-cpf
  python3 -m zipfile -c ../workshop-edge-auth-cpf.zip auth-cpf.js package.json
)

(
  cd artifacts/package-notify
  python3 -m zipfile -c ../workshop-edge-notify.zip notify.js package.json
)

(
  cd artifacts/package-docs
  python3 -m zipfile -c ../workshop-edge-docs.zip docs.js package.json
)

rm -rf artifacts/package-auth-cpf artifacts/package-notify artifacts/package-docs

echo "Artifacts generated in artifacts/"
