
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { RaceRegistration } from './pages/RaceRegistration';
import { RaceResults } from './pages/RaceResults';
import { Standings } from './pages/Standings';
import { ManageRaces } from './pages/ManageRaces';
import { ManageTeams } from './pages/ManageTeams';
import { ManageRacers } from './pages/ManageRacers';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<RaceRegistration />} />
            <Route path="/results" element={<RaceResults />} />
            <Route path="/standings" element={<Standings />} />

            {/* Management Routes */}
            <Route path="/races" element={<ManageRaces />} />
            <Route path="/teams" element={<ManageTeams />} />
            <Route path="/racers" element={<ManageRacers />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
