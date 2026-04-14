"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, Check, Loader2, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushSubscribeButtonProps = {
  creatorToken?: string;
  variant?: "full" | "floating";
};

export default function PushSubscribeButton({
  creatorToken,
  variant = "full",
}: PushSubscribeButtonProps) {
  const subscribePush = useMutation(api.pushSubs.subscribe);
  const [status, setStatus] = useState<
    "idle" | "loading" | "subscribed" | "error" | "denied" | "unsupported"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Check on mount if already subscribed
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) setStatus("subscribed");
    });
  }, []);

  const handleSubscribe = async () => {
    if (status === "subscribed" || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setErrorMsg(
          "Permission denied. Tap the lock icon 🔒 in your browser URL bar → Notifications → Allow."
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID key not configured.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = subscription.toJSON();

      // Generate a simple visitor ID
      let visitorId = localStorage.getItem("teaa_visitor_id");
      if (!visitorId) {
        visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem("teaa_visitor_id", visitorId);
      }

      await subscribePush({
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys?.p256dh!,
        auth: subJson.keys?.auth!,
        visitorId: visitorId,
        creatorToken: creatorToken,
      });

      setStatus("subscribed");
    } catch (err: any) {
      console.error("Push subscribe failed:", err);
      setStatus("error");
      if (
        err.message &&
        err.message.includes("Registration failed - push service error")
      ) {
        setErrorMsg(
          "Your browser is blocking push services. If you're on Brave, go to brave://settings/privacy and enable 'Use Google Services for Push Messaging'."
        );
      } else {
        setErrorMsg(err.message || "Something went wrong.");
      }
    }
  };

  // ── Floating variant (slim top banner for board pages) ──
  if (variant === "floating") {
    if (status === "subscribed" || status === "unsupported" || dismissed) return null;

    return (
      <div className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-b border-amber-500/10 px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Bell size={13} className="text-white" />
          </div>
          <p className="text-[11px] font-semibold text-black/60 truncate">
            Get notified when new tea drops
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "loading" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 rounded-lg">
              <Loader2 size={11} className="animate-spin text-white" />
              <span className="text-[10px] font-bold text-white">Wait...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all shadow-sm shadow-amber-500/20"
            >
              Enable
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-6 h-6 flex items-center justify-center text-black/20 hover:text-black/50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Error tooltip */}
        {(status === "error" || status === "denied") && errorMsg && (
          <div className="absolute top-full left-0 right-0 px-3 py-2 bg-red-50 border-b border-red-200 z-50">
            <p className="text-[10px] font-semibold text-red-600 text-center leading-snug">
              {errorMsg}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Full variant (for create page success screen) ──
  if (status === "unsupported") return null;

  return (
    <div className="flex flex-col gap-2">
      {status === "subscribed" ? (
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
        >
          <Check size={12} />
          Notifications On!
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={status === "loading"}
            className={`group flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
              status === "loading"
                ? "bg-amber-400 text-white/80 cursor-wait"
                : "bg-[#f59e0b] text-white"
            }`}
          >
            {status === "loading" ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                <Bell
                  size={12}
                  className="group-hover:rotate-12 transition-transform"
                />
                Turn on Notifications
              </>
            )}
          </button>

          {(status === "error" || status === "denied") && errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-[10px] font-semibold text-red-600 leading-snug">
                {errorMsg}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
