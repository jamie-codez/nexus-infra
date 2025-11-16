# Docker Compose Environment Variable Extractor

Three scripts to extract environment variables from docker-compose files and format them for `.env` files.

## Scripts Available

1. **Python** - `extract-env.py`
2. **JavaScript** - `extract-env.js`
3. **TypeScript** - `extract-env.ts`

## Installation

### Python
```bash
pip install pyyaml
```

### JavaScript/Node.js
```bash
npm install js-yaml
# or
yarn add js-yaml
```

### TypeScript
```bash
npm install js-yaml @types/js-yaml ts-node typescript
# or
yarn add js-yaml @types/js-yaml ts-node typescript
```

## Usage

### Python
```bash
python extract-env.py path/to/docker-compose.yaml
```

### JavaScript
```bash
node extract-env.js path/to/docker-compose.yaml
```

### TypeScript
```bash
ts-node extract-env.ts path/to/docker-compose.yaml
# or compile first
tsc extract-env.ts && node extract-env.js path/to/docker-compose.yaml
```

## Examples

### Extract from local databases compose file:
```bash
cd local/databases
python ../../extract-env.py docker-compose.yaml
# Creates .env.example in local/databases/
```

### Extract from docker databases compose file:
```bash
cd docker/databases
node ../../extract-env.js docker-compose.yaml
# Creates .env.example in docker/databases/
```

## Output Format

The scripts create a `.env.example` file in the current directory with environment variables grouped by service:

```
### POSTGRES
POSTGRES_DB=
POSTGRES_PASSWORD=
POSTGRES_PORT=
POSTGRES_USER=

### MYSQL
MYSQL_DATABASE=
MYSQL_PASSWORD=
MYSQL_PORT=
MYSQL_ROOT_PASSWORD=
MYSQL_USER=

### MONGODB
MONGO_INITDB_DATABASE=
MONGO_INITDB_ROOT_PASSWORD=
MONGO_INITDB_ROOT_USERNAME=
MONGO_PORT=
```

## Features

- Extracts variables from `environment` section
- Extracts variables from `ports` section
- Extracts variables from `volumes` section
- Extracts variables from `command` section
- Extracts variables from `healthcheck` section
- Groups variables by service name
- Alphabetically sorts variables within each group
- Outputs in `.env` file format with `=` ready for values
