```mermaid
sequenceDiagram
    participant SPA
    participant CBG as Gateway
    participant API

    activate SPA
    activate CBG
    SPA->>CBG: Open WS connection
    CBG->>SPA: Send registration id as UUID
    SPA->>API: Calls for a long running job
    activate API
    API-->>SPA: Responds 202: Accepted
    API->>CBG: Calls with actual response content
    deactivate API
    CBG->>SPA: Send notification (WS)
    deactivate SPA
    deactivate CBG
```