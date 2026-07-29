import AdminSidebar from "../components/AdminSidebar";


function AdminLayout({
  user,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar user={user} />

      <main className="min-h-screen lg:ml-64">
        {children}
      </main>
    </div>
  );
}


export default AdminLayout;