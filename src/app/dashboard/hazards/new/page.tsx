"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Upload, Loader2, MapPin, AlertTriangle } from "lucide-react";

interface DuplicateMatch {
  id: string;
  title: string;
  score: number;
}

interface AnalysisResult {
  title: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  ai_complaint_draft: string;
  duplicates: DuplicateMatch[];
}

// Phone photos are often 5-10MB; Groq rejects base64 images over ~4MB.
// Downscale to max 1280px and re-encode as JPEG.
async function compressImage(file: File, maxSize = 1280, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function NewHazardPage() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(file: File) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function geocodeAddress() {
    if (!address.trim()) {
      setError("Type an address first.");
      return;
    }
    setLocating(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        setError("Couldn't find that address. Try adding more detail (city, area) or use current location instead.");
        return;
      }
      setLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
    } catch {
      setError("Address lookup failed. Check your connection and try again.");
    } finally {
      setLocating(false);
    }
  }

  function getLocation() {
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Please allow location access and try again.");
        setLocating(false);
      }
    );
  }

  async function analyze() {
    if (!imageFile || !location) {
      setError("Add a photo and your location first.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const dataUrl = await compressImage(imageFile);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data_url: dataUrl,
          latitude: location.lat,
          longitude: location.lng,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveHazard() {
    if (!result || !location) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hazards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          description: result.description,
          category: result.category,
          severity: result.severity,
          latitude: location.lat,
          longitude: location.lng,
          address,
          ai_complaint_draft: result.ai_complaint_draft,
          duplicate_of: result.duplicates[0]?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push(`/dashboard/hazards/${data.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Report a hazard</h1>
      <p className="text-sm text-zinc-500 mb-6">Photograph it, confirm your location, and let AI draft the complaint.</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4 space-y-4">
        <div>
          <label className="text-sm text-zinc-400 block mb-2">Photo</label>
          {imagePreview ? (
            <img src={imagePreview} alt="Hazard preview" className="w-full h-48 object-cover rounded-lg mb-2" />
          ) : (
            <div className="w-full h-32 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center mb-2">
              <p className="text-sm text-zinc-600">No photo selected</p>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition w-fit">
            <Upload className="w-4 h-4" />
            {imageFile ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2">Location</label>
          {location ? (
            <p className="text-sm text-emerald-400 flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5" /> Location captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
            </p>
          ) : (
            <button
              onClick={getLocation}
              disabled={locating}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition mb-2"
            >
              <MapPin className="w-4 h-4" />
              {locating ? "Getting location..." : "Use my current location"}
            </button>
          )}
          <div className="flex gap-2">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address or landmark"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 transition"
            />
            <button
              onClick={geocodeAddress}
              disabled={locating || !address.trim()}
              className="shrink-0 flex items-center gap-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 px-3 py-2 rounded-lg transition"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              Look up
            </button>
          </div>
        </div>

        <button
          onClick={analyze}
          disabled={analyzing || !imageFile || !location}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-medium py-2.5 rounded-lg transition"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {analyzing ? "Analyzing..." : "Analyze with AI"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {result && result.duplicates.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-medium text-amber-400">Possible duplicate reports nearby</p>
          </div>
          <div className="space-y-1.5">
            {result.duplicates.map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/hazards/${d.id}`}
                className="flex items-center justify-between text-sm text-zinc-300 hover:text-white transition"
              >
                <span className="truncate">{d.title}</span>
                <span className="text-xs text-zinc-500 shrink-0 ml-3">{Math.round(d.score * 100)}% match</span>
              </Link>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            You can still save this as a new report, or confirm the existing one instead.
          </p>
        </div>
      )}

      {result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{result.title}</h3>
            <span className="text-xs px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400">
              {result.severity}
            </span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{result.description}</p>
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-1">AI-drafted formal complaint</p>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{result.ai_complaint_draft}</p>
          </div>
          <button
            onClick={saveHazard}
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-medium py-2.5 rounded-lg transition"
          >
            {saving ? "Saving..." : "Submit report"}
          </button>
        </div>
      )}
    </div>
  );
}