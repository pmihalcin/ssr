import { OrderNotFound } from "@ssr/ui";
import { OrderLink } from "@/components/OrderLink";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <OrderNotFound Link={OrderLink} />
    </main>
  );
}
