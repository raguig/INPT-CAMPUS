"use client";

import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ConnectorTestResponse,
  WebScraperFormValues,
} from "@/lib/connectors-types";

type WebScraperFormProps = {
  initialValues: WebScraperFormValues;
  onCancel: () => void;
  onSubmit: (values: WebScraperFormValues) => Promise<void>;
  onTestConnection: (
    values: Pick<WebScraperFormValues, "depth" | "urls">,
  ) => Promise<ConnectorTestResponse>;
  submitLabel: string;
  submitting?: boolean;
  testing?: boolean;
};

type WebErrors = Partial<Record<"form" | "urls", string>>;

function buildSignature(values: Pick<WebScraperFormValues, "depth" | "urls">) {
  return JSON.stringify({
    depth: values.depth,
    urls: values.urls.map((url) => url.trim()).filter(Boolean),
  });
}

export function WebScraperForm({
  initialValues,
  onCancel,
  onSubmit,
  onTestConnection,
  submitLabel,
  submitting = false,
  testing = false,
}: WebScraperFormProps) {
  const [values, setValues] = useState<WebScraperFormValues>(initialValues);
  const [errors, setErrors] = useState<WebErrors>({});
  const [testedSignature, setTestedSignature] = useState(
    buildSignature(initialValues),
  );
  const [testResult, setTestResult] = useState<ConnectorTestResponse | null>(
    initialValues.urls.length
      ? {
          message: "Configuration existante prete a etre enregistree.",
          ok: true,
        }
      : null,
  );

  const urlText = values.urls.join("\n");
  const currentSignature = useMemo(
    () => buildSignature(values),
    [values],
  );

  const validateUrls = () => {
    const cleanedUrls = values.urls.map((url) => url.trim()).filter(Boolean);
    if (!cleanedUrls.length) {
      setErrors({ urls: "Ajoutez au moins une URL a analyser." });
      return null;
    }

    const invalidUrl = cleanedUrls.find((url) => {
      try {
        const parsed = new URL(url);
        return !/^https?:$/.test(parsed.protocol);
      } catch {
        return true;
      }
    });

    if (invalidUrl) {
      setErrors({
        urls: `URL invalide : ${invalidUrl}`,
      });
      return null;
    }

    setErrors({});
    return cleanedUrls;
  };

  const handleTest = async () => {
    const cleanedUrls = validateUrls();
    if (!cleanedUrls) {
      return;
    }

    try {
      const result = await onTestConnection({
        depth: values.depth,
        urls: cleanedUrls,
      });
      setTestResult(result);
      if (result.ok) {
        setTestedSignature(
          buildSignature({
            depth: values.depth,
            urls: cleanedUrls,
          }),
        );
      }
    } catch (error) {
      setTestResult({
        message:
          error instanceof Error
            ? error.message
            : "Le test de connexion a echoue.",
        ok: false,
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedUrls = validateUrls();
    if (!cleanedUrls) {
      return;
    }

    if (currentSignature !== testedSignature || !testResult?.ok) {
      setErrors({
        form: "Testez la connexion avant d'enregistrer ce connecteur.",
      });
      return;
    }

    try {
      await onSubmit({
        ...values,
        urls: cleanedUrls,
      });
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer ce connecteur web.",
      });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="scraperUrls">URLs a synchroniser</Label>
        <Textarea
          id="scraperUrls"
          placeholder="https://www.inpt.ac.ma&#10;https://moodle.inpt.ac.ma/my/"
          value={urlText}
          error={Boolean(errors.urls)}
          onChange={(event) => {
            const nextUrls = event.target.value.split(/\r?\n/);
            setValues((current) => ({
              ...current,
              urls: nextUrls,
            }));
            if (buildSignature({ depth: values.depth, urls: nextUrls }) !== testedSignature) {
              setTestResult(null);
            }
          }}
        />
        {errors.urls ? <p className="text-sm text-red-600">{errors.urls}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scraperDepth">Profondeur</Label>
          <Select
            id="scraperDepth"
            value={String(values.depth)}
            onChange={(event) => {
              const nextDepth = Number(event.target.value) as 1 | 2;
              setValues((current) => ({
                ...current,
                depth: nextDepth,
              }));
              if (
                buildSignature({ depth: nextDepth, urls: values.urls }) !==
                testedSignature
              ) {
                setTestResult(null);
              }
            }}
          >
            <option value="1">1 - Page uniquement</option>
            <option value="2">2 - Suivre les liens</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webFrequency">Frequence de sync</Label>
          <Select
            id="webFrequency"
            value={values.syncInterval}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                syncInterval: event.target.value as WebScraperFormValues["syncInterval"],
              }))
            }
          >
            <option value="manual">Manuel</option>
            <option value="hourly">Toutes les heures</option>
            <option value="daily">Quotidien</option>
          </Select>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Tester la connexion
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Verifiez que les URLs fournies sont joignables avant de sauvegarder.
            </p>
          </div>
          <Button
            disabled={testing}
            type="button"
            variant="secondary"
            onClick={handleTest}
          >
            {testing ? "Test en cours..." : "Tester la connexion"}
          </Button>
        </div>

        {testResult ? (
          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              testResult.ok
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            {testResult.message}
          </div>
        ) : null}
      </div>

      {errors.form ? <p className="text-sm text-red-600">{errors.form}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button disabled={submitting || testing} type="submit">
          {submitting ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
