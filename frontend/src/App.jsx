import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Criminals from './pages/Criminals';
import FIRs from './pages/FIRs';
import Cases from './pages/Cases';
import Roles from './pages/Roles';
import Evidence from './pages/Evidence';
import Hearings from './pages/Hearings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="criminals" element={<Criminals />} />
            <Route path="firs" element={<FIRs />} />
            <Route path="cases" element={<Cases />} />
            <Route path="roles" element={<Roles />} />
            <Route path="evidence" element={<Evidence />} />
            <Route path="hearings" element={<Hearings />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
