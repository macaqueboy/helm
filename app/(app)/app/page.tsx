import { redirect } from "next/navigation";

export default function AppPage() {
  // Redirect to first generic channel for demo
  redirect("/app/channel/general");
}