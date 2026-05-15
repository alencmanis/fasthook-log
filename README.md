# fasthook-log

Local HTTP request logger for testing FastHook tunnel deliveries from [www.fasthook.io](https://www.fasthook.io).

Use this repository together with `fasthook-cli` when you want to inspect webhook deliveries from a FastHook CLI destination.

It prints the request method, URL, headers, and body, then responds with:

```json
{ "ok": true }
```

## Run

```powershell
npm start
```

The server listens on `http://localhost:8080` by default.

Use `npm start` here because `fasthook-log` is a server script, not a CLI bin. In `fasthook-cli`, use `npx .` because that package exposes the local `fasthook` command.

## Custom port

Pass the port after `--`:

```powershell
npm start -- 9090
```

Or use the `PORT` environment variable:

```powershell
$env:PORT="9090"; npm start
```

If you run `fasthook-log` on a custom port, point `fasthook-cli` at the same port:

```powershell
npx . tunnel 9090
```

For the default setup, run both sides on `8080`:

```powershell
# in fasthook-log
npm start

# in fasthook-cli
npx . tunnel
```

## Body limit

By default, the logger keeps up to `65536` bytes of the request body. Larger bodies are truncated in logs, but the server still responds.

Set `MAX_BODY_BYTES` to change the logged body limit:

```powershell
$env:MAX_BODY_BYTES="1048576"; npm start
```

You can combine it with a custom port:

```powershell
$env:PORT="9090"; $env:MAX_BODY_BYTES="1048576"; npm start
```

## Notes

- The server binds to `0.0.0.0`, so it accepts local requests to `localhost` and `127.0.0.1`.
- It is meant for local development and debugging, not production traffic.
- Stop it with `Ctrl+C`.
