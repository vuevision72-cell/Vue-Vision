'use client';
import { useUserProfile } from "@/hooks/use-user-profile";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-12 w-1/4 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // To protect this layout, specify the roles that are allowed.
  const { isLoading, isAuthorized } = useUserProfile(['student', 'admin', 'mentor']);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthorized) {
    // The hook will have already initiated a redirect, so you can return null or a loader.
    return null;
  }

  return <main>{children}</main>;
}
