import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Recommend() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/advisor");
  }, [router]);

  return null;
}
