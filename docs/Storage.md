# Storage

Port: `IStorage` in `apps/backend/src/storage`.

## Drivers

| Driver | Status |
| --- | --- |
| `local` | Implemented (filesystem) |
| `s3` | Abstraction ready (SDK later) |
| `minio` | S3-compatible abstraction |
| `r2` | S3-compatible abstraction |

## Config

`STORAGE_DRIVER`, `STORAGE_LOCAL_PATH`, `S3_*`, `MAX_UPLOAD_BYTES`

## Rule

No upload HTTP API in this phase — call `getStorage()` from services when features land.
