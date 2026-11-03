import DonationHistoryClient from "@/components/donations/DonationHistoryClient";

export const dynamic = "force-dynamic";

export const metadata = {
  // The root layout's title template appends the site name.
  title: "Your Donation History",
  description: "Verify your email to see the donations you've made to MESCO Trust.",
  robots: { index: false, follow: false },
};

export default function MyDonationsPage() {
  return (
    <main>
      <DonationHistoryClient donateHref="/donate-now" />
    </main>
  );
}
