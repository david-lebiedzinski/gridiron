import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "@/context/auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/client";
import { APP, ONBOARDING } from "@/locales/en";

interface StepPhotoProps {
  onComplete: () => void;
}

export default function StepPhoto({ onComplete }: StepPhotoProps) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  function handlePickFile() {
    fileRef.current?.click();
  }

  function handleSkip() {
    onComplete();
  }

  async function handleUpload() {
    if (!file || !user) {
      return;
    }

    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      await updateProfile.mutateAsync({
        avatar: urlData.publicUrl,
      });

      onComplete();
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setBusy(false);
    }
  }

  let previewContent: React.ReactNode;
  if (preview) {
    previewContent = <img src={preview} alt="Avatar" />;
  } else {
    previewContent = "\uD83D\uDC64";
  }

  return (
    <>
      <div className="avatar-upload">
        <div
          className={`avatar-preview${preview ? " has-image" : ""}`}
          onClick={handlePickFile}
        >
          {previewContent}
        </div>
        <div>
          <button
            className="avatar-upload-btn"
            type="button"
            onClick={handlePickFile}
          >
            {ONBOARDING.uploadPhoto}
          </button>
          <div className="avatar-skip" onClick={handleSkip}>
            {ONBOARDING.skipForNow}
          </div>
        </div>
      </div>
      <div className="avatar-meta">{ONBOARDING.photoHint}</div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        className="step-btn"
        style={{ marginTop: 16 }}
        disabled={busy || !preview}
        onClick={handleUpload}
      >
        {busy ? ONBOARDING.uploading : APP.continue}
      </button>
    </>
  );
}
