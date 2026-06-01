# Debian slim (glibc) so the psycopg[binary] wheel installs without a build
# toolchain — Alpine (musl) has no prebuilt psycopg binary wheel.
FROM python:3.12.12-slim

WORKDIR /backend

# uv is the project's package manager (see CLAUDE.md).
RUN pip install --no-cache-dir uv

# Dependency layer — cached unless requirements change.
COPY src/requirements.txt ./requirements.txt
RUN uv pip install --system --no-cache -r requirements.txt

# Application source — editing it does not invalidate the dependency layer.
COPY src/ .

EXPOSE 3000

CMD ["python3", "main.py"]
