# Security policy

Please report security issues privately through GitHub's security advisory
feature rather than a public issue.

The library blocks active URL schemes and unsafe `data:` resource types, does
not enable raw Markdown HTML, and truncates generic tool payloads before
rendering. Applications remain responsible for server-side authorization,
attachment validation, malware scanning, rate limiting, and safe tool design.
