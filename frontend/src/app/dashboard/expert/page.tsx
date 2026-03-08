import { getCurrentUser } from "../../actions/auth";
import { redirect } from "next/navigation";
import ExpertConsultantClient from "../../../components/expert/ExpertConsultantClient";

export const metadata = {
  title: "Uzman Danışman | Kimyasal Takip",
  description: "AI Destekli Teknik Danışmanlık",
};

export default async function ExpertPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "admin" && user.role !== "lab")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Uzman Danışman
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Laboratuvar ve üretim süreçleriniz için yapay zeka destekli teknik
          destek alın.
        </p>
      </div>
      <ExpertConsultantClient />
    </div>
  );
}
