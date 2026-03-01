# Demo Assets

This folder contains sample seat auth files for local UI/error-state testing.

## Recommended demo flow

Use built-in demo mode instead of these files:

```bash
# .env
DEMO_MODE=1
```

This serves mock seat list + statuses without any real auth files.

## Sample auth files

`demo/seats/*.json` are placeholder tokens and intentionally invalid for upstream API usage.

If you point `SEATS_DIRECTORY` at `demo/seats`, the app will:

- list seats successfully
- show API/token errors when trying to fetch live status

For full setup and API behavior, see the root [README](../README.md).
