import { Dashboard } from "./Dashboard";
import { OrderPage } from "./OrderPage";
import { usePathname } from "./router";

export function App() {
  const pathname = usePathname();
  const order = /^\/orders\/([^/]+)\/?$/.exec(pathname);
  return order ? <OrderPage id={decodeURIComponent(order[1]!)} /> : <Dashboard />;
}
