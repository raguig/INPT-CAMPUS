from datetime import datetime, timezone
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine, select

from app.core.config import settings


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def _seed_agents(session: Session) -> None:
    """Seed the three pre-built agents if the agents table is empty."""
    from app.models.agent import Agent

    existing = session.exec(select(Agent)).first()
    if existing is not None:
        return  # already seeded

    seeds = [
        Agent(
            name="Assistant Académique",
            description=(
                "Assistant spécialisé dans les questions académiques : "
                "emplois du temps, calendrier universitaire et recherche "
                "dans la base de connaissances du campus."
            ),
            system_prompt=(
                "Tu es l'Assistant Académique du Campus INPT. "
                "Tu aides les étudiants avec les emplois du temps, "
                "les dates limites et les informations académiques. "
                "Réponds toujours en français de manière claire et concise. "
                "Utilise les outils à ta disposition pour fournir des "
                "informations précises."
            ),
            collection_ids="[]",
            tools='["rag_search", "get_schedule", "get_deadlines"]',
            is_active=True,
        ),
        Agent(
            name="Conseiller Stages",
            description=(
                "Conseiller spécialisé dans les offres de stage, "
                "la recherche de stages et l'accompagnement des "
                "étudiants dans leur parcours professionnel."
            ),
            system_prompt=(
                "Tu es le Conseiller Stages du Campus INPT. "
                "Tu aides les étudiants à trouver des stages, "
                "à préparer leurs candidatures et à comprendre "
                "les opportunités disponibles. Réponds en français."
            ),
            collection_ids="[]",
            tools='["rag_search", "get_internships"]',
            is_active=True,
        ),
        Agent(
            name="Assistant Administratif",
            description=(
                "Assistant pour les démarches administratives : "
                "génération d'attestations, lettres de motivation, "
                "conventions de stage et autres documents officiels."
            ),
            system_prompt=(
                "Tu es l'Assistant Administratif du Campus INPT. "
                "Tu aides les étudiants à générer des documents "
                "administratifs comme les attestations de scolarité, "
                "les lettres de motivation et les conventions de stage. "
                "Réponds en français."
            ),
            collection_ids="[]",
            tools='["rag_search", "generate_document"]',
            is_active=True,
        ),
    ]

    for agent in seeds:
        session.add(agent)
    session.commit()


def _seed_internships(session: Session) -> None:
    """Seed sample internship offers if table is empty."""
    from app.models.internship import Internship
    from datetime import timedelta

    existing = session.exec(select(Internship)).first()
    if existing is not None:
        return

    now = datetime.now(timezone.utc)
    seeds = [
        Internship(
            title="Stage Data Science – Machine Learning",
            company="OCP Group",
            location="Casablanca",
            remote="hybride",
            description="Rejoignez l'équipe Data & IA pour développer des modèles prédictifs appliqués à l'industrie minière. Vous travaillerez sur le traitement de données massives et l'optimisation de processus industriels.",
            required_skills='["Python", "TensorFlow", "SQL", "Data Analysis", "Machine Learning"]',
            filieres='["DATA", "ICCN"]',
            duration="4 mois",
            offer_type="stage",
            deadline=now + timedelta(days=30),
        ),
        Internship(
            title="PFE – Développement d'une plateforme IoT",
            company="Maroc Telecom",
            location="Rabat",
            remote="presentiel",
            description="Conception et développement d'une plateforme de gestion d'objets connectés. Intégration avec les réseaux LoRaWAN et MQTT pour la supervision en temps réel.",
            required_skills='["React", "Node.js", "MQTT", "IoT", "Docker"]',
            filieres='["ASEDS", "CLOUD"]',
            duration="6 mois",
            offer_type="pfe",
            deadline=now + timedelta(days=45),
        ),
        Internship(
            title="Stage Cybersécurité – Audit & Pentest",
            company="Deloitte Maroc",
            location="Casablanca",
            remote="presentiel",
            description="Participez aux missions d'audit de sécurité informatique et tests d'intrusion pour des clients grands comptes. Formation aux outils SIEM et frameworks OWASP.",
            required_skills='["Kali Linux", "Burp Suite", "OWASP", "Réseau", "Python"]',
            filieres='["ICCN"]',
            duration="3 mois",
            offer_type="stage",
            deadline=now + timedelta(days=20),
        ),
        Internship(
            title="Stage Cloud & DevOps – Migration AWS",
            company="Capgemini",
            location="Rabat",
            remote="hybride",
            description="Accompagnez l'équipe dans la migration d'infrastructures vers AWS. Mise en place de pipelines CI/CD, conteneurisation et monitoring.",
            required_skills='["AWS", "Kubernetes", "Terraform", "CI/CD", "Linux"]',
            filieres='["CLOUD", "ASEDS", "ICCN"]',
            duration="4 mois",
            offer_type="stage",
            deadline=now + timedelta(days=35),
        ),
        Internship(
            title="PFE – Application mobile santé connectée",
            company="UM6P",
            location="Ben Guerir",
            remote="presentiel",
            description="Développement d'une application mobile Flutter pour le suivi de la santé des patients avec intégration de capteurs biomédicaux et tableau de bord médecin.",
            required_skills='["Flutter", "Firebase", "API REST", "UI/UX", "Dart"]',
            filieres='["ASEDS"]',
            duration="6 mois",
            offer_type="pfe",
            deadline=now + timedelta(days=60),
        ),
        Internship(
            title="Stage Réseaux – Optimisation 5G",
            company="Orange Maroc",
            location="Rabat",
            remote="distanciel",
            description="Étude et optimisation des performances du réseau 5G. Analyse de KPIs, simulation de scénarios de déploiement et automatisation avec Python.",
            required_skills='["5G", "Python", "Réseaux", "Wireshark", "Simulation"]',
            filieres='["SESNUM"]',
            duration="3 mois",
            offer_type="stage",
            deadline=now + timedelta(days=25),
        ),
    ]
    for s in seeds:
        session.add(s)
    session.commit()


def _seed_global_settings(session: Session) -> None:
    """Seed default global settings if table is empty."""
    from app.models.settings import GLOBAL_DEFAULTS, GlobalSetting

    existing = session.exec(select(GlobalSetting)).first()
    if existing is not None:
        return

    for key, value in GLOBAL_DEFAULTS.items():
        session.add(GlobalSetting(key=key, value=value))
    session.commit()


def init_db() -> None:
    # Import all models so SQLModel discovers every table
    from app.models import (  # noqa: F401
        Agent, AgentRun, AgentStep,
        Application,
        Club, ClubEvent, ClubMembership, ClubPost, ClubPostLike,
        Connector, EventRegistration,
        Feedback, GeneratedDocument,
        GlobalSetting, Internship,
        RefreshTokenBlacklist, StudentProfile, SyncLog,
        UsageLog, User, UserSetting,
    )

    SQLModel.metadata.create_all(engine)

    # Seed defaults
    with Session(engine) as session:
        _seed_agents(session)
        _seed_internships(session)
        _seed_global_settings(session)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

