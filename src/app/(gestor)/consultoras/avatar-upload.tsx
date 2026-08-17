"use client";

import { useActionState, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { uploadAvatar, type UploadAvatarState } from "@/lib/actions/upload-avatar";

const initialState: UploadAvatarState = {};

/** Clique na foto pra trocar — usado na linha da consultora em /consultoras. */
export function AvatarUpload({
  consultantId,
  fullName,
  avatarUrl,
}: {
  consultantId: string;
  fullName: string;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(uploadAvatar, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="consultantId" value={consultantId} />
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="group relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Trocar foto de ${fullName}`}
        title="Clique pra trocar a foto"
      >
        <Avatar fullName={fullName} src={state.avatarUrl ?? avatarUrl} size="sm" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? "…" : "Trocar"}
        </span>
      </button>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
