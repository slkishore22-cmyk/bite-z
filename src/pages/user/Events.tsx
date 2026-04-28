import UserLayout from "@/components/user/UserLayout";

const Events = () => (
  <UserLayout>
    <div
      className="min-h-screen antialiased"
      style={{
        background: "#F5F5F7",
        color: "#1D1D1F",
        paddingBottom: 96,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          paddingTop: 48,
          paddingLeft: 24,
          paddingRight: 24,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        Events
      </h1>
      <p style={{ paddingLeft: 24, paddingRight: 24, marginTop: 8, color: "#6E6E73" }}>
        Campus food events coming soon.
      </p>
    </div>
  </UserLayout>
);

export default Events;
