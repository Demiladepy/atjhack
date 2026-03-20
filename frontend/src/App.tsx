import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./routes/Home";
import Login from "./routes/Login";
import Dashboard from "./routes/Dashboard";
import Transactions from "./routes/Transactions";
import CreditScore from "./routes/CreditScore";
import Debtors from "./routes/Debtors";
import PaymentSuccess from "./routes/PaymentSuccess";
import { AppShell } from "@/components/layout/AppShell";
import { usePrimaryMerchant } from "@/hooks/usePrimaryMerchant";

const queryClient = new QueryClient();

function CreditScoreIndex() {
  const { merchant } = usePrimaryMerchant();
  if (!merchant) return <Navigate to="/dashboard" replace />;
  return <Navigate to={`/credit-score/${merchant.id}`} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/debtors" element={<Debtors />} />
            <Route path="/credit-score" element={<CreditScoreIndex />} />
            <Route path="/credit-score/:id" element={<CreditScore />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
