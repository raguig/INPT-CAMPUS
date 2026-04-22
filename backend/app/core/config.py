import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"
DATA_DIR = BASE_DIR / "data"


def load_env_file(path: Path = ENV_FILE) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file()
DATA_DIR.mkdir(parents=True, exist_ok=True)
os.environ["CHROMA_CACHE_DIR"] = str((DATA_DIR / ".chroma_cache").resolve())
os.environ["ANONYMIZED_TELEMETRY"] = "False"


@dataclass(frozen=True)
class Settings:
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-campus-inpt-secret")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_days: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    database_url: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(DATA_DIR / 'campus_inpt.db').resolve().as_posix()}",
    )


settings = Settings()
