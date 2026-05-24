import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export default async function GradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/teacher/assignments/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4 inline mr-1" />
          返回作业详情
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-4">批改查看</h2>
      <p className="text-muted-foreground">Assignment ID: {id}</p>
    </div>
  );
}
