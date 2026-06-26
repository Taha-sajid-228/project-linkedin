# FastAPI Auth Backend

## Database Management & Schema Updates

During development, table schemas can become desynchronized from the SQLAlchemy models. Since `Base.metadata.create_all()` does not update existing tables when columns are added/removed, we use Alembic for migrations, or you can drop and recreate the tables.

### 1. Recreating the Database (For Development)

If the schema is out of sync or you want a fresh start, you can drop the existing tables and let SQLAlchemy recreate them:

#### Option A: Using PostgreSQL Client (pgAdmin or psql)
Connect to your database and run:
```sql
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS alembic_version CASCADE;
```
Once dropped, restart the FastAPI backend. SQLAlchemy's `Base.metadata.create_all(bind=engine)` in `main.py` will automatically recreate the table with the latest schema. Then, stamp the database so Alembic is in sync:
```bash
venv\Scripts\alembic stamp head
```

#### Option B: Quick CLI Command
You can run a python command from the `fastapi-auth` directory to drop and recreate the tables:
```bash
venv\Scripts\python -c "from database import engine, Base; import models; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)"
venv\Scripts\alembic stamp head
```

---

### 2. Database Migrations (Alembic)

To apply existing migrations to the database:
```bash
venv\Scripts\alembic upgrade head
```

To auto-generate a new migration after editing `models.py`:
```bash
venv\Scripts\alembic revision --autogenerate -m "describe your changes"
```

To mark the database as up-to-date without running migration SQL commands (e.g. if the tables already exist):
```bash
venv\Scripts\alembic stamp head
```
