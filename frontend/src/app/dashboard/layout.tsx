import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions/auth";
import DashboardSidebar from "../../components/dashboard/Sidebar";
import DashboardHeader from "../../components/dashboard/Header";
import { ThemeProvider } from "../../components/ThemeProvider";
import ChatBot from "../../components/chat/ChatBot";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <DashboardSidebar user={user as any} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={user as any} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ChatBot />
          </ThemeProvider>
        </main>
      </div>
    </div>
  );
}
