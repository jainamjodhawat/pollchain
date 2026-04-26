import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Proposals from "./pages/Proposals";
import ProposalDetail from "./pages/ProposalDetail";
import CreateProposal from "./pages/CreateProposal";
import About from "./pages/About";
import Faucet from "./pages/Faucet";
import Dashboard from "./pages/Dashboard";
import Delegate from "./pages/Delegate";
import Leaderboard from "./pages/Leaderboard";
import Treasury from "./pages/Treasury";
import MyProposals from "./pages/MyProposals";
import NotificationBanner from "./components/NotificationBanner";
import "./styles/globals.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <NotificationBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/proposals/:id" element={<ProposalDetail />} />
        <Route path="/create" element={<CreateProposal />} />
        <Route path="/my-proposals" element={<MyProposals />} />
        <Route path="/faucet" element={<Faucet />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/delegate" element={<Delegate />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/treasury" element={<Treasury />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
