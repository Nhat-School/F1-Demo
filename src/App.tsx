
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { RaceRegistration } from './pages/RaceRegistration';
import { RaceResults } from './pages/RaceResults';
import { Standings } from './pages/Standings';

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
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
