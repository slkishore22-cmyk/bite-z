import UserLayout from "@/components/user/UserLayout";

const Profile = () => (
  <UserLayout>
    <div
      className="min-h-screen pb-32 antialiased"
      style={{ background: "#F5F5F7", color: "#1D1D1F" }}
    >
      <main className="px-6 mx-auto w-full max-w-md pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Hey, Alex 👋</h1>
        <div className="lg-card p-6">
          <div className="relative z-10 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "#2563EB", color: "#fff" }}
            >
              A
            </div>
            <div>
              <p className="text-base font-semibold">Alex Kumar</p>
              <p className="text-sm" style={{ color: "#6E6E73" }}>
                alex@campus.edu
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </UserLayout>
);

export default Profile;
