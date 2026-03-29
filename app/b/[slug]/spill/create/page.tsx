"use client";

import { useParams } from "next/navigation";
import SpillCreator from "@/app/components/SpillCreator";

export default function BoardSpillCreatePage() {
  const params = useParams();
  const slug = params.slug as string;

  return <SpillCreator mode="board" slug={slug} />;
}
