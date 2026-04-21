"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SkillsInput } from "@/components/profile/SkillsInput";
import { CVUpload } from "@/components/profile/CVUpload";
import { fetchProfile, updateProfile } from "@/lib/internships-api";
import type { StudentProfileData } from "@/lib/internships-types";
import { useAuthStore } from "@/lib/auth-store";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id)
      .then((p) => {
        setProfile(p);
        setBio(p.bio);
        setSkills(p.skills);
        setLanguages(p.languages);
        setCvFilename(p.cv_filename);
        setLinkedinUrl(p.linkedin_url ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfile(user.id, {
        bio,
        skills,
        languages,
        cv_filename: cvFilename ?? undefined,
        linkedin_url: linkedinUrl || undefined,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [user, bio, skills, languages, cvFilename, linkedinUrl]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6">
        {/* Header */}
        <section className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8">
          <div className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Profil
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900">
            Mon Profil
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complétez votre profil pour améliorer les correspondances IA.
          </p>
        </section>

        {/* Form */}
        <div className="rounded-[2rem] border border-white/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="space-y-7 px-7 py-8">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-emerald-600 text-2xl font-bold text-white shadow-lg">
                {user?.full_name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "??"}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{user?.full_name ?? "Étudiant"}</p>
                <p className="text-sm text-slate-500">{user?.email ?? ""}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Parlez-nous de vous, de vos intérêts et de vos objectifs…"
                rows={4}
              />
            </div>

            {/* Skills */}
            <SkillsInput
              label="Compétences"
              value={skills}
              onChange={setSkills}
              placeholder="Ex: Python, React, Docker…"
            />

            {/* Languages */}
            <SkillsInput
              label="Langues"
              value={languages}
              onChange={setLanguages}
              placeholder="Ex: Français, Anglais, Arabe…"
            />

            {/* CV */}
            <CVUpload
              filename={cvFilename}
              onUpload={(file) => setCvFilename(file.name)}
              onClear={() => setCvFilename(null)}
            />

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/votre-profil"
              />
            </div>
          </div>

          {/* Save footer */}
          <div className="flex items-center justify-between border-t border-slate-100/60 px-7 py-5">
            {saved && (
              <span className="text-sm font-semibold text-emerald-600">
                ✓ Profil sauvegardé
              </span>
            )}
            {!saved && <span />}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
