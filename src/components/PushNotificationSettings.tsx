import { useState } from "react";
import { Bell, BellOff, Smartphone, AlertCircle, Loader2, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserSession } from "@/utils/sessionManager";

export function PushNotificationSettings() {
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    isiOS,
    isPWA,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  const [sending, setSending] = useState(false);

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast({ title: "Notifications disabled" });
      } else {
        await subscribe();
        toast({ title: "Notifications enabled" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleTest = async () => {
    setSending(true);
    try {
      const s = getUserSession() as { id?: string; user_id?: string } | null;
      const userId = s?.id || s?.user_id;
      if (!userId) throw new Error("Not signed in");
      await supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: userId,
          payload: {
            title: "Test Notification 🔔",
            body: "Push notifications are working!",
            url: "/app/home",
          },
        },
      });
      toast({ title: "Test sent" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (isiOS && !isPWA) {
    return (
      <div className="lg-card p-5 mt-4">
        <div className="relative z-10 flex items-start gap-3">
          <Smartphone className="w-5 h-5 mt-0.5" style={{ color: "#0071E3" }} />
          <div>
            <p className="text-base font-semibold">Push Notifications</p>
            <p className="text-sm mt-1" style={{ color: "#6E6E73" }}>
              Install the app first:
            </p>
            <ol className="text-sm mt-2 space-y-1 list-decimal pl-4" style={{ color: "#6E6E73" }}>
              <li>Tap the Share button in Safari</li>
              <li>Tap "Add to Home Screen"</li>
              <li>Open the app from your home screen</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="lg-card p-5 mt-4">
        <div className="relative z-10 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" style={{ color: "#6E6E73" }} />
          <div>
            <p className="text-base font-semibold">Push Notifications</p>
            <p className="text-sm" style={{ color: "#6E6E73" }}>
              Not supported in this browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="lg-card p-5 mt-4">
        <div className="relative z-10 flex items-center gap-3">
          <BellOff className="w-5 h-5" style={{ color: "#6E6E73" }} />
          <div>
            <p className="text-base font-semibold">Push Notifications</p>
            <p className="text-sm" style={{ color: "#6E6E73" }}>
              Permission denied — update browser settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-card p-5 mt-4">
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5" style={{ color: "#2563EB" }} />
          ) : (
            <BellOff className="w-5 h-5" style={{ color: "#6E6E73" }} />
          )}
          <div>
            <p className="text-base font-semibold">Push Notifications</p>
            <p className="text-sm" style={{ color: "#6E6E73" }}>
              {isSubscribed ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
        <Switch
          checked={isSubscribed}
          disabled={isLoading}
          onCheckedChange={handleToggle}
        />
      </div>
      {isSubscribed && (
        <div className="relative z-10 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={sending}
            className="w-full"
          >
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Test Notification
          </Button>
        </div>
      )}
    </div>
  );
}