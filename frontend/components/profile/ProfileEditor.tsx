"use client";

import { UserCircle2 } from "lucide-react";
import { useState } from "react";

import { CVUpload } from "@/components/profile/CVUpload";
import { SkillsInput } from "@/components/profile/SkillsInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api-config";
import type { StudentProfile } from "@/lib/internships-types";

type ProfileEditorProps = {
  token: string;
  initialProfile: StudentProfile;
};

export function ProfileEditor({ token, initialProfile }: ProfileEditorProps) {
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [skills, setSkills] = useState(initialProfile.skills);
  const [languages, setLanguages] = useState(initialProfile.languages);
  const [linkedin, setLinkedin] = useState(initialProfile.linkedin_url ?? "");
  const [cvUrl, setCvUrl] = useState(initialProfile.cv_url ?? "");
  const [cvFileName, setCvFileName] = useState<string | null>(
    initialProfile.cv_url ? initialProfile.cv_url.split("/").pop() ?? null : null,
  );
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveProfile = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const response = await fetch(`${getApiBaseUrl()}/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio,
          cv_url: cvUrl,
          languages,
          linkedin_url: linkedin,
          skills,
        }),
      });

      if (!response.ok) {
        throw new Error("save failed");
      }

      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_4%_10%,rgba(14,165,233,0.16),transparent_25%),radial-gradient(circle_at_90%_14%,rgba(16,185,129,0.16),transparent_30%)]" />
      <div className="relative mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Profil étudiant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-10 w-10 text-slate-500" />
                )}
              </div>
              <label className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Upload avatar
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    setAvatar(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Bio</p>
              <textarea
                value={bio}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="Décris ton profil et tes objectifs"
                onChange={(event) => setBio(event.target.value)}
              />
            </div>

            <SkillsInput
              label="Skills"
              placeholder="Tape une compétence puis Entrée"
              value={skills}
              onChange={setSkills}
            />

            <SkillsInput
              label="Langues"
              placeholder="Tape une langue puis Entrée"
              value={languages}
              onChange={setLanguages}
            />

            <CVUpload
              token={token}
              fileName={cvFileName}
              onUploaded={(url, fileName) => {
                setCvUrl(url);
                setCvFileName(fileName);
              }}
            />

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">LinkedIn</p>
              <Input
                value={linkedin}
                placeholder="https://www.linkedin.com/in/..."
                onChange={(event) => setLinkedin(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" disabled={isSaving} onClick={() => void saveProfile()}>
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              {saved ? <p className="text-sm font-medium text-emerald-700">Profil sauvegardé</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
