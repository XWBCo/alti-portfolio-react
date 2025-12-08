import ImpactAnalyticsSubNav from '@/components/impact-analytics/SubNav';

export default function ImpactAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ImpactAnalyticsSubNav />
      {children}
    </>
  );
}
