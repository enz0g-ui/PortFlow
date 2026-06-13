import { redirect } from "next/navigation";

// The signals studio has been folded into the single /news page. Keep this
// route as a redirect so old links/bookmarks still land somewhere useful.
export default function SignalsRedirect() {
  redirect("/news");
}
