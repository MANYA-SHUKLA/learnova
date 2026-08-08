# Certificate Permissions

| Permission | Roles | Capability |
|------------|-------|------------|
| `certificate:read` | student, faculty, institution_admin | View own/all certificates, verify codes, download |
| `certificate:write` | faculty, institution_admin | Issue certificates and transcripts to eligible students |
| `certificate:manage` | institution_admin | Templates, **revoke**, bulk publish, registry export, audit |

**Not in v1.0:** faculty “recommend certificate” — faculty issue directly; only admins revoke.

Students always receive scoped access to their own documents only.
