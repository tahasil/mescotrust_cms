import DonationFailedClient from "./DonationFailedClient";
import { getPageSeoMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "donation/failed",
    fallbackTitle: "Donation Failed",
    fallbackDescription: "Your donation payment failed or was cancelled.",
    fallbackCanonical: "/donation/failed",
    fallbackOpenGraphUrl: "/donation/failed",
  });
}

export default function DonationFailedPage() {
  return <DonationFailedClient />;
}
