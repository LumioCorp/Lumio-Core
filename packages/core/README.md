# Lumio Core

Plataforma de financiamiento colectivo para eventos construida sobre la red Stellar.

## Stack

- **Runtime**: Node.js 20 LTS
- **Lenguaje**: TypeScript 5.x
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL 16
- **Blockchain**: Stellar (Horizon API)

## Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar PostgreSQL
docker compose up -d

# Configurar variables de entorno
cp .env.example .env

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Iniciar en desarrollo
npm run dev
```

## Estructura

```
src/
├── api/          # Rutas HTTP y controladores
├── services/     # Lógica de negocio
├── models/       # Prisma client y tipos
└── lib/          # Utilidades (cifrado, Stellar wrappers)
```

## Documentación

Ver carpeta `.lumio/` para documentación técnica detallada:

- `ARCHITECTURE.md` - Stack y flujo de datos
- `ROADMAP_STATUS.md` - Estado del proyecto
- `STELLAR_FLOWS.md` - Operaciones Stellar

---

**LumioCorp** - 2026
