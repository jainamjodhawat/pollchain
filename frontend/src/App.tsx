import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import NotificationBanner from "./components/NotificationBanner";
import "./styles/globals.css";

const Home = lazy(() => import("./pages/Home"));
const Proposals = lazy(() => import("./pages/Proposals"));
const ProposalDetail = lazy(() => import("./pages/ProposalDetail"));
const CreateProposal = lazy(() => import("./pages/CreateProposal"));
const About = lazy(() => import("./pages/About"));
const Faucet = lazy(() => import("./pages/Faucet"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Delegate = lazy(() => import("./pages/Delegate"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Treasury = lazy(() => import("./pages/Treasury"));
const MyProposals = lazy(() => import("./pages/MyProposals"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

function RouteLoading() {
  return (
    <main className="page-wrapper" aria-busy="true">
      <div className="container">
        <div className="empty-state" role="status" aria-live="polite">
          <div className="spinner" />
          <p className="empty-state-desc">Loading PollChain…</p>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <NotificationBanner />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
          <Route path="/create" element={<CreateProposal />} />
          <Route path="/my-proposals" element={<MyProposals />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/faucet" element={<Faucet />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/delegate" element={<Delegate />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
