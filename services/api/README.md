# Python FastAPI Backend for LMS

## Quick Start

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Set environment variables (or create .env file)
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/lms"
export JWT_SECRET="your-secret-key"

# Run development server
uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI application entry point
│   ├── config.py        # Pydantic settings
│   ├── errors.py        # JSON exception handlers
│   ├── auth/
│   │   ├── jwt.py       # JWT signing/verification
│   │   ├── password.py  # Password hashing (bcrypt)
│   │   └── deps.py      # FastAPI dependencies (require_auth)
│   ├── db/
│   │   ├── session.py   # SQLAlchemy async session
│   │   └── models.py    # ORM models
│   ├── rbac/
│   │   └── service.py   # Permission resolution
│   ├── scope/
│   │   └── node.py      # Node/tenant scoping
│   └── routes/
│       ├── auth.py      # /api/auth/* endpoints
│       ├── users.py     # /api/users/* endpoints
│       ├── courses.py   # /api/courses/* endpoints
│       └── ...          # Other resource routes
├── tests/
│   ├── test_auth.py
│   ├── test_rbac.py
│   └── test_node_scope.py
├── requirements.txt
└── README.md
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | - | PostgreSQL connection string (asyncpg format) |
| JWT_SECRET | Yes | - | Secret key for HS256 signing |
| JWT_ISSUER | No | lms-auth | JWT issuer claim |
| JWT_AUDIENCE | No | lms-api | JWT audience claim |
| ACCESS_TOKEN_MINUTES | No | 15 | Access token expiry |
| REFRESH_TOKEN_DAYS | No | 7 | Refresh token expiry |
| ENV | No | development | Environment (development/production/test) |

## API Compatibility

This backend is designed to be a drop-in replacement for the Next.js API routes.
All endpoints under `/api/*` maintain the same:
- Request/response schemas
- Authentication (httpOnly cookies)
- RBAC permissions
- Node scoping rules

## Next.js Integration

Add to `next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ];
}
```

## Running Tests

```bash
cd backend
pytest tests/ -v
```
