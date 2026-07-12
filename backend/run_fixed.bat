@echo off
set CLERK_JWKS_URI=https://oriented-eft-56.clerk.accounts.dev/.well-known/jwks.json
java -jar target\certificates-0.0.1-SNAPSHOT.jar
