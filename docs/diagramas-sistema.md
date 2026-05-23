# Diagramas clave del sistema

## Objetivo

Reunir los diagramas principales del proyecto en un formato versionable y facil de revisar desde GitHub o cualquier visor compatible con Mermaid.

Estos diagramas resumen el estado actual del sistema, no la propuesta inicial. Para el detalle textual por capa, revisar:

- [backend-funcionamiento.md](backend-funcionamiento.md)
- [frontend-funcionamiento.md](frontend-funcionamiento.md)
- [modelo-transaccional-brazaletes.md](modelo-transaccional-brazaletes.md)

## Diagrama entidad-relacion principal

```mermaid
erDiagram
    User ||--o{ PurchaseReceipt : creates
    User ||--o{ Sale : customer
    User ||--o{ Bracelet : owns
    User ||--o{ Testimonial : writes
    User ||--o{ BraceletTransaction : performs

    BraceletType ||--o{ Bracelet : configures
    BraceletType ||--o{ SaleLine : sold_as

    PurchaseReceipt ||--o| Sale : pays
    Sale ||--|{ SaleLine : contains
    SaleLine ||--|| Bracelet : emits

    Bracelet ||--o{ BraceletTransaction : records
    Food ||--o{ BraceletTransaction : food_consumption
    Attractions ||--o{ BraceletTransaction : attraction_consumption

    Sale ||--o{ BraceletTransaction : sale_origin
    SaleLine ||--o{ BraceletTransaction : line_origin
    PurchaseReceipt ||--o{ BraceletTransaction : receipt_trace

    User {
        bigint id PK
        string username
        string email
        boolean is_staff
        decimal account_balance
        image profile_image
    }

    BraceletType {
        bigint id PK
        string name
        decimal price
        integer attraction_uses
        decimal food_balance
        boolean is_active
    }

    Bracelet {
        bigint id PK
        string code
        bigint owner_id FK
        bigint bracelet_type_id FK
        decimal current_balance
        integer attraction_uses_remaining
    }

    PurchaseReceipt {
        bigint id PK
        string code
        bigint user_id FK
        decimal amount_paid
        string payment_method
        string status
        string paypal_order_id
    }

    Sale {
        bigint id PK
        bigint customer_id FK
        bigint receipt_id FK
        string status
        string channel
        decimal total_amount
    }

    SaleLine {
        bigint id PK
        bigint sale_id FK
        bigint bracelet_type_id FK
        bigint bracelet_id FK
        integer quantity
        decimal unit_price
        decimal line_total
    }

    BraceletTransaction {
        bigint id PK
        bigint bracelet_id FK
        string transaction_type
        string concept
        decimal balance_delta
        integer uses_delta
        decimal balance_before
        decimal balance_after
        integer uses_before
        integer uses_after
    }

    Food {
        bigint id PK
        string name
        decimal price
    }

    Attractions {
        bigint id PK
        string name
        integer usage_points
    }

    Testimonial {
        bigint id PK
        bigint user_id FK
        string status
        integer rating
    }
```

## Secuencia de compra de brazalete

```mermaid
sequenceDiagram
    actor Cliente
    participant Frontend as React/Vite
    participant API as Django REST API
    participant PayPal as PayPal
    participant DB as PostgreSQL

    Cliente->>Frontend: Selecciona tipo de brazalete
    Frontend->>API: Consulta tipos activos
    API->>DB: Lee BraceletType activos
    DB-->>API: Catalogo disponible
    API-->>Frontend: Tipos de brazalete

    alt Pago con saldo interno
        Cliente->>Frontend: Confirma compra interna
        Frontend->>API: POST /compra_brazaletes/recibos/
        API->>DB: Valida saldo del cliente
        API->>DB: Crea PurchaseReceipt, Sale, SaleLine, Bracelet
        API->>DB: Registra BraceletTransaction ACTIVATION
        API-->>Frontend: receipt_id
    else Pago con PayPal
        Cliente->>Frontend: Aprueba pago PayPal
        Frontend->>API: POST /paypal/create-order/
        API->>PayPal: Crea orden
        PayPal-->>API: order_id
        API-->>Frontend: order_id
        Frontend->>PayPal: Aprobacion del comprador
        PayPal-->>Frontend: orderID aprobado
        Frontend->>API: POST /paypal/capture-order/
        API->>PayPal: Verifica y captura orden
        PayPal-->>API: COMPLETED
        API->>DB: Crea PurchaseReceipt, Sale, SaleLine, Bracelet
        API->>DB: Registra BraceletTransaction ACTIVATION
        API-->>Frontend: receipt_id
    end

    Frontend->>API: GET recibo por id
    API->>DB: Consulta recibo y brazalete emitido
    DB-->>API: Datos del recibo
    API-->>Frontend: Detalle de compra
    Frontend-->>Cliente: Muestra recibo
```

## Navegacion principal

```mermaid
flowchart TD
    A["Inicio publico"] --> B["Comprar brazaletes"]
    A --> C["Atracciones y comidas"]
    A --> D["Sobre nosotros"]
    A --> E["Contacto"]
    A --> F["Terminos y condiciones"]
    A --> G["Login"]
    G --> H["Registro"]
    G --> I["Recuperar contrasena"]

    G --> J{"Sesion valida?"}
    J -->|"Cliente"| K["Mi perfil"]
    J -->|"Administrador"| L["Panel administrador"]
    J -->|"No"| G

    K --> M["Datos personales"]
    K --> N["Mis brazaletes"]
    K --> O["Historial de movimientos"]
    N --> P["Recibo de compra"]
    N --> O
    B --> P
    C --> O

    L --> Q["Clientes"]
    L --> R["Brazaletes y tipos"]
    L --> S["Ventas y recibos"]
    L --> T["Movimientos"]
    L --> U["Comidas"]
    L --> V["Atracciones"]
    L --> W["Testimonios"]
```

## Mapa de capas

```mermaid
flowchart LR
    UI["React SPA\nRutas publicas, cliente y admin"] --> APIClient["Axios API layer\nToken, sesion y helpers"]
    APIClient --> DRF["Django REST Framework\nViews, serializers, permisos"]
    DRF --> Domain["Dominio Django\nUsuarios, brazaletes, ventas, ledger"]
    Domain --> DB["PostgreSQL\nDatos transaccionales"]
    DRF --> PayPal["PayPal API\nOrdenes, captura, webhook"]
    DRF --> Email["Email backend\nRecuperacion de contrasena"]
    DRF --> Media["Media local\nImagenes de perfil, catalogos y brazaletes"]
```

## Notas de consistencia

- El frontend bloquea rutas por experiencia de usuario, pero la autorizacion definitiva esta en backend.
- La regla administrativa canonica es `is_staff`, expuesta al frontend como `is_admin`.
- `PurchaseReceipt` no reemplaza a `Sale`; el recibo representa pago y la venta representa negocio.
- `Bracelet.current_balance` y `Bracelet.attraction_uses_remaining` son estado actual materializado; el historial vive en `BraceletTransaction`.
- Las comidas y atracciones se consumen contra el brazalete, no como ventas nuevas de brazaletes.
