"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormAlert } from "@/components/forms/FormAlert";
import { Button } from "@/components/ui/Button";
import { cancelMyOrder } from "@/lib/orders/actions";

export function CancelOrderButton({ orderId, number }: { orderId: string; number: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Annuler la commande ${number} ? Les articles seront remis en vente.`)) return;
          startTransition(async () => {
            const result = await cancelMyOrder(orderId);
            if (!result.ok) return setError(result.error);
            router.refresh();
          });
        }}
      >
        {pending ? "Annulation…" : "Annuler ma commande"}
      </Button>
      <FormAlert message={error} className="mt-2" />
    </div>
  );
}
