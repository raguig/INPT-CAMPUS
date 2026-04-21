"""Document generation service.

Handles:
  * Jinja2 template rendering for simple documents (attestation, demande)
  * Mistral LLM calls for AI-powered documents (lettre_motivation, rapport_outline)
  * HTML → PDF conversion via weasyprint
  * File storage + metadata tracking
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader

from app.core.config import BASE_DIR, DATA_DIR

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

TEMPLATES_DIR = BASE_DIR / "app" / "templates"
DOCS_OUTPUT_DIR = DATA_DIR / "documents"
DOCS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Jinja2 environment
# ---------------------------------------------------------------------------

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=True,
)

# ---------------------------------------------------------------------------
# Template metadata registry
# ---------------------------------------------------------------------------

TEMPLATE_META: list[dict[str, Any]] = [
    {
        "type": "ATTESTATION_SCOLARITE",
        "label": "Attestation de scolarité",
        "icon": "📜",
        "description": "Document officiel certifiant l'inscription de l'étudiant à l'INPT.",
        "fields": ["full_name", "student_id", "filiere", "year", "academic_year"],
        "ai_powered": False,
    },
    {
        "type": "LETTRE_MOTIVATION",
        "label": "Lettre de motivation",
        "icon": "✉️",
        "description": "Lettre de motivation personnalisée générée par IA pour vos candidatures.",
        "fields": ["internship_title", "company_name"],
        "ai_powered": True,
    },
    {
        "type": "DEMANDE_CONGE",
        "label": "Demande de congé",
        "icon": "🏖️",
        "description": "Formulaire officiel de demande de congé adressé à la direction.",
        "fields": ["start_date", "end_date", "reason"],
        "ai_powered": False,
    },
    {
        "type": "RAPPORT_STAGE_OUTLINE",
        "label": "Plan de rapport de stage",
        "icon": "📊",
        "description": "Structure de rapport de stage générée par IA basée sur la description du stage.",
        "fields": ["company_name", "internship_title", "internship_description"],
        "ai_powered": True,
    },
]

_TEMPLATE_FILE_MAP: dict[str, str] = {
    "ATTESTATION_SCOLARITE": "attestation_scolarite.html",
    "LETTRE_MOTIVATION": "lettre_motivation.html",
    "DEMANDE_CONGE": "demande_conge.html",
    "RAPPORT_STAGE_OUTLINE": "rapport_stage_outline.html",
}

# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------


async def _generate_cover_letter(
    student_info: dict[str, Any],
    variables: dict[str, Any],
) -> str:
    """Call Mistral to generate a cover letter body."""
    try:
        from mistralai import Mistral

        client = Mistral(api_key=os.getenv("MISTRAL_API_KEY", ""))

        skills = student_info.get("skills", [])
        skills_str = ", ".join(skills) if skills else "non spécifiées"

        prompt = f"""Rédige le corps d'une lettre de motivation en français pour un(e) étudiant(e) INPT.

Informations de l'étudiant :
- Nom : {student_info.get('full_name', 'Étudiant(e) INPT')}
- Filière : {student_info.get('filiere', 'Ingénierie')}
- Année : {student_info.get('year', '?')}ème année
- Compétences : {skills_str}

Poste visé : {variables.get('internship_title', 'Stage')}
Entreprise : {variables.get('company_name', 'Entreprise')}

Consignes :
- 3 paragraphes maximum
- Ton professionnel mais pas trop formel
- Mentionne les compétences pertinentes
- Ne commence PAS par "Madame, Monsieur" (c'est déjà dans le template)
- Ne termine PAS par des formules de politesse (c'est déjà dans le template)
- Retourne uniquement le corps de la lettre en HTML (paragraphes <p>)"""

        response = await client.chat.complete_async(
            model=os.getenv("LLM_MODEL", "mistral-small-latest"),
            messages=[{"role": "user", "content": prompt}],
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.7")),
            max_tokens=800,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("LLM cover letter generation failed: %s", exc)
        return "<p>Madame, Monsieur, je me permets de vous soumettre ma candidature pour ce poste. Fort(e) de ma formation à l'INPT, je suis convaincu(e) de pouvoir contribuer à vos projets.</p>"


async def _generate_report_outline(
    student_info: dict[str, Any],
    variables: dict[str, Any],
) -> str:
    """Call Mistral to generate a stage report chapter outline."""
    try:
        from mistralai import Mistral

        client = Mistral(api_key=os.getenv("MISTRAL_API_KEY", ""))

        prompt = f"""Génère un plan détaillé de rapport de stage en français pour un(e) étudiant(e) INPT.

Informations :
- Étudiant : {student_info.get('full_name', 'Étudiant(e)')}
- Filière : {student_info.get('filiere', 'Ingénierie')}
- Entreprise : {variables.get('company_name', 'Entreprise')}
- Sujet : {variables.get('internship_title', 'Stage')}
- Description : {variables.get('internship_description', 'Non fournie')}

Consignes :
- Génère 6 à 8 chapitres avec sous-sections
- Inclus : Introduction, Présentation de l'entreprise, Contexte du projet, Méthodologie, Réalisation, Résultats, Conclusion
- Format : utilise des balises HTML <div class="chapter">, <h3> pour les titres de chapitres, <ul><li> pour les sous-sections
- Sois spécifique au sujet du stage"""

        response = await client.chat.complete_async(
            model=os.getenv("LLM_MODEL", "mistral-small-latest"),
            messages=[{"role": "user", "content": prompt}],
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.5")),
            max_tokens=1200,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("LLM report outline generation failed: %s", exc)
        return """
<div class="chapter"><h3>Chapitre 1 — Introduction</h3><ul><li>Contexte général</li><li>Objectifs du stage</li></ul></div>
<div class="chapter"><h3>Chapitre 2 — Présentation de l'entreprise</h3><ul><li>Historique</li><li>Secteur d'activité</li></ul></div>
<div class="chapter"><h3>Chapitre 3 — Environnement technique</h3><ul><li>Technologies utilisées</li><li>Architecture existante</li></ul></div>
<div class="chapter"><h3>Chapitre 4 — Réalisation</h3><ul><li>Conception</li><li>Développement</li><li>Tests</li></ul></div>
<div class="chapter"><h3>Chapitre 5 — Résultats et discussion</h3><ul><li>Résultats obtenus</li><li>Analyse</li></ul></div>
<div class="chapter"><h3>Chapitre 6 — Conclusion</h3><ul><li>Bilan</li><li>Perspectives</li></ul></div>
"""


# ---------------------------------------------------------------------------
# Main generation pipeline
# ---------------------------------------------------------------------------


async def generate_document(
    template_type: str,
    variables: dict[str, Any],
    student_info: dict[str, Any],
) -> str:
    """Generate a PDF document and return the output file path.

    For simple templates: fill Jinja2 → render HTML → convert to PDF.
    For AI templates: call LLM → merge into Jinja2 → render HTML → convert to PDF.
    """

    template_file = _TEMPLATE_FILE_MAP.get(template_type)
    if not template_file:
        raise ValueError(f"Unknown template type: {template_type}")

    # Build context — merge student info + user variables + auto-computed fields
    now = datetime.now(timezone.utc)
    ctx: dict[str, Any] = {
        "full_name": student_info.get("full_name", ""),
        "student_id": student_info.get("student_id", ""),
        "filiere": student_info.get("filiere", ""),
        "year": student_info.get("year", ""),
        "email": student_info.get("email", ""),
        "date": now.strftime("%d/%m/%Y"),
        "academic_year": f"{now.year - 1}/{now.year}" if now.month < 9 else f"{now.year}/{now.year + 1}",
        **variables,
    }

    # AI-powered content generation
    if template_type == "LETTRE_MOTIVATION":
        content = await _generate_cover_letter(student_info, variables)
        ctx["content"] = content
    elif template_type == "RAPPORT_STAGE_OUTLINE":
        content = await _generate_report_outline(student_info, variables)
        ctx["content"] = content

    # Render HTML from Jinja2
    template = _jinja_env.get_template(template_file)
    html_content = template.render(**ctx)

    # Convert to PDF
    output_filename = f"{template_type.lower()}_{uuid.uuid4().hex[:8]}.pdf"
    output_path = DOCS_OUTPUT_DIR / output_filename

    try:
        from weasyprint import HTML
        HTML(string=html_content).write_pdf(str(output_path))
    except ImportError:
        # Fallback: save as HTML if weasyprint is not installed
        output_filename = output_filename.replace(".pdf", ".html")
        output_path = DOCS_OUTPUT_DIR / output_filename
        output_path.write_text(html_content, encoding="utf-8")
        logger.warning(
            "weasyprint not installed — saved as HTML instead: %s", output_path,
        )

    return str(output_path)
