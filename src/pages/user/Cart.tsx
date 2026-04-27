import UserLayout from "@/components/user/UserLayout";

const Cart = () => (
  <UserLayout>
    <div
      className="min-h-screen pb-32 antialiased"
      style={{ background: "#F5F5F7", color: "#1D1D1F" }}
    >
      <main className="px-6 mx-auto w-full max-w-md pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Your Cart 🛒</h1>
        <div className="lg-card p-6">
          <div className="relative z-10">
            <p className="text-base font-semibold">Your cart is empty</p>
            <p className="text-sm mt-1" style={{ color: "#6E6E73" }}>
              Tap items on Home to add them here.
            </p>
          </div>
        </div>
      </main>
    </div>
  </UserLayout>
);

export default Cart;
