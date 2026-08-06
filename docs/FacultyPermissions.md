# Faculty Permissions

| Permission | Description |
| --- | --- |
| `faculty:read` | Directory, profiles, stats, exports |
| `faculty:write` | Own profile, office hours, photo, password (via auth) |
| `faculty:manage` | Full CRUD, bulk ops, import, activate/deactivate |

## Role matrix

| Role | Access |
| --- | --- |
| Institution Admin | Full access (`read` + `write` + `manage`) |
| Faculty | View/edit own profile (`read` + `write`) |
| Student | Read-only directory (`read`) |
