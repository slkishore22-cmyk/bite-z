import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/user/UserLayout";
import { getUserSession } from "@/utils/sessionManager";
import { logoutUser } from "@/lib/userAuth";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";

const Profile = () => {
  const navigate = useNavigate();
  const s = getUserSession() as
    | { full_name?: string; name?: string; email?: string }
    | null;
  const fullName = s?.full_name || s?.name || "Friend";
  const initial = fullName.charAt(0).toUpperCase();
  const firstName = fullName.split(" ")[0];
  const handleLogout = async () => {
    await logoutUser();
    navigate("/app/login", { replace: true });
  };
  return (
  <UserLayout>
    <div
      className="min-h-screen pb-32 antialiased"
      style={{ background: "#F5F5F7", color: "#1D1D1F" }}
    >
      <main className="px-6 mx-auto w-full max-w-md pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-8">
          Hey, {firstName} 👋
        </h1>
        <div className="lg-card p-6">
          <div className="relative z-10 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "#2563EB", color: "#fff" }}
            >
              {initial}
            </div>
            <div>
              <p className="text-base font-semibold">{fullName}</p>
              <p className="text-sm" style={{ color: "#6E6E73" }}>
                {s?.email || ""}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <PushNotificationSettings />
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full font-semibold transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "transparent",
            border: "1.5px solid rgba(0,113,227,0.3)",
            borderRadius: 9999,
            color: "#0071E3",
            fontSize: 15,
            padding: "14px 0",
          }}
        >
          Sign Out
        </button>
      </main>
    </div>
  </UserLayout>
  );
};

export default Profile;
